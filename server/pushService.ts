import webpush from "web-push";
import { db } from "./db";
import { pushSubscriptions, pushSendEvents } from "@shared/schema";
import { eq, and, desc, gte, lt, sql } from "drizzle-orm";

const VAPID_PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY ?? "").trim();
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
const VAPID_EMAIL_RAW = process.env.VAPID_EMAIL?.trim();
const VAPID_EMAIL =
  VAPID_EMAIL_RAW && /^(mailto:|https?:\/\/)/i.test(VAPID_EMAIL_RAW)
    ? VAPID_EMAIL_RAW
    : "mailto:servntrak@peralta.pt";

if (VAPID_EMAIL_RAW && VAPID_EMAIL_RAW !== VAPID_EMAIL) {
  console.warn(
    "[pushService] VAPID_EMAIL ignorado (não é um URL mailto:/https:// válido). A usar valor por omissão.",
  );
}

let pushEnabled = false;
let vapidConfigError: string | null = null;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    pushEnabled = true;
    console.log("[pushService] Notificações push ativadas (VAPID configurada).");
  } catch (err: any) {
    vapidConfigError = err?.message || String(err);
    console.warn(
      "[pushService] Notificações push desativadas: configuração VAPID inválida —",
      vapidConfigError,
    );
  }
} else {
  vapidConfigError = "VAPID_PUBLIC_KEY e/ou VAPID_PRIVATE_KEY em falta nos Secrets.";
  console.warn(
    "[pushService] Notificações push desativadas: VAPID_PUBLIC_KEY e/ou VAPID_PRIVATE_KEY em falta nos Secrets.",
  );
}

export function isPushEnabled(): boolean {
  return pushEnabled;
}

// ─── SSRF protection ───────────────────────────────────────────────
// Only well-known browser push services are accepted as subscription
// endpoints. Without this, an authenticated user could register an
// arbitrary HTTPS URL and weaponise the server's outbound HTTP client
// (web-push) into a blind SSRF probe against internal hosts or
// third-party endpoints. We enforce this at registration time AND
// again when sending, so previously stored bad endpoints are also
// neutralised.

const DEFAULT_ALLOWED_HOSTS: readonly string[] = [
  // Google FCM (Chrome, Edge Chromium, most Android browsers)
  "fcm.googleapis.com",
  "android.googleapis.com",
  // Mozilla Autopush (Firefox)
  "updates.push.services.mozilla.com",
  "updates-autopush.stage.mozaws.net",
  "updates-autopush.dev.mozaws.net",
  // Apple Web Push (Safari)
  "web.push.apple.com",
  "api.push.apple.com",
];

const DEFAULT_ALLOWED_HOST_SUFFIXES: readonly string[] = [
  // Mozilla Autopush nodes are *.push.services.mozilla.com
  ".push.services.mozilla.com",
  // Apple APNs nodes are *.push.apple.com
  ".push.apple.com",
  // Microsoft WNS (Edge legacy / Windows): *.notify.windows.com
  ".notify.windows.com",
];

// PUSH_ENDPOINT_EXTRA_ALLOWED_HOSTS: optional, comma-separated list of
// additional hosts to accept as push endpoints, on top of the built-in
// browser push services. Use sparingly — every entry widens the SSRF
// blast radius. Each entry is one of:
//   - exact host       e.g. "push.staging.example.com"
//   - suffix wildcard  e.g. "*.push.staging.example.com" (matches any
//                      subdomain but NOT the bare suffix itself)
// Example: PUSH_ENDPOINT_EXTRA_ALLOWED_HOSTS="push.staging.example.com,*.dev-push.example.org"
// On startup the resolved extras are logged so operators can audit
// what was actually accepted.
function parseExtraHosts(): { exact: Set<string>; suffixes: string[] } {
  const raw = process.env.PUSH_ENDPOINT_EXTRA_ALLOWED_HOSTS?.trim();
  const exact = new Set<string>();
  const suffixes: string[] = [];
  if (!raw) return { exact, suffixes };
  for (const part of raw.split(",")) {
    const host = part.trim().toLowerCase();
    if (!host) continue;
    if (host.startsWith("*.") && host.length > 2) {
      suffixes.push(host.slice(1));
    } else if (host.startsWith(".") && host.length > 1) {
      suffixes.push(host);
    } else {
      exact.add(host);
    }
  }
  return { exact, suffixes };
}

const EXTRA = parseExtraHosts();
const ALLOWED_HOSTS = new Set<string>(
  DEFAULT_ALLOWED_HOSTS.map((h) => h.toLowerCase()),
);
EXTRA.exact.forEach((h) => ALLOWED_HOSTS.add(h));
const ALLOWED_HOST_SUFFIXES: readonly string[] = [
  ...DEFAULT_ALLOWED_HOST_SUFFIXES.map((s) => s.toLowerCase()),
  ...EXTRA.suffixes,
];

if (EXTRA.exact.size || EXTRA.suffixes.length) {
  const extras: string[] = [];
  EXTRA.exact.forEach((h) => extras.push(h));
  for (const s of EXTRA.suffixes) extras.push(s);
  console.info(
    `[pushService] PUSH_ENDPOINT_EXTRA_ALLOWED_HOSTS aplicado: ${extras.join(", ")}`,
  );
}

export function isAllowedPushEndpoint(endpoint: unknown): boolean {
  if (typeof endpoint !== "string" || endpoint.length === 0 || endpoint.length > 2048) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  // Block URLs that smuggle credentials, fragments, or non-default ports.
  if (url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;
  if (url.hash) return false;
  const host = url.hostname.toLowerCase();
  if (!host) return false;
  if (ALLOWED_HOSTS.has(host)) return true;
  for (const suffix of ALLOWED_HOST_SUFFIXES) {
    if (host.endsWith(suffix) && host.length > suffix.length) {
      return true;
    }
  }
  return false;
}

const RECENT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PRUNE_INTERVAL_MS = 60 * 60 * 1000; // hourly

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const trimmed = raw.trim();
  if (trimmed === "") return fallback;
  if (!/^\d+$/.test(trimmed)) {
    console.warn(
      `[pushService] Valor inválido em ${name}="${raw}". A usar default ${fallback}.`,
    );
    return fallback;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.warn(
      `[pushService] Valor inválido em ${name}="${raw}". A usar default ${fallback}.`,
    );
    return fallback;
  }
  return n;
}

function parseNonNegativeIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const trimmed = raw.trim();
  if (trimmed === "") return fallback;
  if (!/^\d+$/.test(trimmed)) {
    console.warn(
      `[pushService] Valor inválido em ${name}="${raw}". A usar default ${fallback}.`,
    );
    return fallback;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) {
    console.warn(
      `[pushService] Valor inválido em ${name}="${raw}". A usar default ${fallback}.`,
    );
    return fallback;
  }
  return n;
}

function parseRate(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// Thresholds for the "high failure rate" banner. Both must be exceeded for
// the alert to trigger so a couple of one-off failures (or a single retry
// burst) don't raise a false alarm.
const FAILURE_ALERT_MIN_COUNT = parsePositiveInt(
  process.env.PUSH_FAILURE_ALERT_MIN_COUNT,
  5,
);
const FAILURE_ALERT_RATE = parseRate(
  process.env.PUSH_FAILURE_ALERT_RATE,
  0.5,
);

type FailureKind = "auth" | "gone" | "other";

async function recordSendEvent(event: {
  status: "success" | "failure";
  endpointPreview: string;
  statusCode: number | null;
  kind: FailureKind | null;
  message: string | null;
}): Promise<void> {
  try {
    await db.insert(pushSendEvents).values({
      status: event.status,
      kind: event.kind,
      statusCode: event.statusCode,
      endpointPreview: event.endpointPreview,
      message: event.message,
    });
  } catch (err) {
    console.warn(
      "[pushService] Falha ao registar evento push em DB:",
      (err as Error)?.message || err,
    );
  }
}

let lastPruneAt = 0;

async function pruneOldEvents(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastPruneAt < PRUNE_INTERVAL_MS) return;
  lastPruneAt = now;
  try {
    const cutoff = new Date(now - RETENTION_MS);
    await db.delete(pushSendEvents).where(lt(pushSendEvents.at, cutoff));
  } catch (err) {
    console.warn(
      "[pushService] Falha ao limpar eventos push antigos:",
      (err as Error)?.message || err,
    );
  }
}

// Schedule background cleanup so retention is enforced even if the health
// endpoint isn't being polled.
setInterval(() => {
  void pruneOldEvents(true);
}, PRUNE_INTERVAL_MS).unref?.();

export type PushFailureSummary = {
  at: number;
  statusCode: number | null;
  kind: FailureKind;
};

export type PushHealthStatus = {
  enabled: boolean;
  configError: string | null;
  totals: { sent: number; failed: number; authFailed: number };
  lastSuccessAt: number | null;
  lastFailure: PushFailureSummary | null;
  lastAuthFailure: PushFailureSummary | null;
  recentWindowMinutes: number;
  recentSuccessCount: number;
  recentFailureCount: number;
  recentAuthFailureCount: number;
  recentTotalCount: number;
  recentFailureRate: number; // 0..1, 0 when no recent attempts
  failureAlertMinCount: number;
  failureAlertRate: number;
  hasActiveVapidProblem: boolean;
  hasHighFailureRate: boolean;
};

export async function getPushHealthStatus(): Promise<PushHealthStatus> {
  // Best-effort cleanup so old rows don't skew counters.
  await pruneOldEvents();

  const now = Date.now();
  const recentCutoff = new Date(now - RECENT_WINDOW_MS);
  const retentionCutoff = new Date(now - RETENTION_MS);

  let totalSent = 0;
  let totalFailed = 0;
  let totalAuthFailed = 0;
  let recentSuccessCount = 0;
  let recentFailureCount = 0;
  let recentAuthFailureCount = 0;
  let lastSuccessAt: number | null = null;
  let lastFailure: PushFailureSummary | null = null;
  let lastAuthFailure: PushFailureSummary | null = null;

  try {
    // Totals within the retention window grouped by status + kind.
    const totalsRows = await db
      .select({
        status: pushSendEvents.status,
        kind: pushSendEvents.kind,
        count: sql<number>`count(*)::int`,
      })
      .from(pushSendEvents)
      .where(gte(pushSendEvents.at, retentionCutoff))
      .groupBy(pushSendEvents.status, pushSendEvents.kind);

    for (const row of totalsRows) {
      if (row.status === "success") {
        totalSent += row.count;
      } else if (row.status === "failure") {
        totalFailed += row.count;
        if (row.kind === "auth") totalAuthFailed += row.count;
      }
    }

    // Recent attempts (last hour) grouped by status + kind, so we can
    // compute both the failure count and the failure ratio.
    const recentRows = await db
      .select({
        status: pushSendEvents.status,
        kind: pushSendEvents.kind,
        count: sql<number>`count(*)::int`,
      })
      .from(pushSendEvents)
      .where(gte(pushSendEvents.at, recentCutoff))
      .groupBy(pushSendEvents.status, pushSendEvents.kind);

    for (const row of recentRows) {
      if (row.status === "success") {
        recentSuccessCount += row.count;
      } else if (row.status === "failure") {
        recentFailureCount += row.count;
        if (row.kind === "auth") recentAuthFailureCount += row.count;
      }
    }

    const [lastSuccessRow] = await db
      .select({ at: pushSendEvents.at })
      .from(pushSendEvents)
      .where(eq(pushSendEvents.status, "success"))
      .orderBy(desc(pushSendEvents.at))
      .limit(1);
    lastSuccessAt = lastSuccessRow?.at ? lastSuccessRow.at.getTime() : null;

    const [lastFailureRow] = await db
      .select({
        at: pushSendEvents.at,
        statusCode: pushSendEvents.statusCode,
        kind: pushSendEvents.kind,
      })
      .from(pushSendEvents)
      .where(eq(pushSendEvents.status, "failure"))
      .orderBy(desc(pushSendEvents.at))
      .limit(1);
    if (lastFailureRow?.at) {
      lastFailure = {
        at: lastFailureRow.at.getTime(),
        statusCode: lastFailureRow.statusCode,
        kind: ((lastFailureRow.kind as FailureKind | null) ?? "other"),
      };
    }

    const [lastAuthRow] = await db
      .select({
        at: pushSendEvents.at,
        statusCode: pushSendEvents.statusCode,
      })
      .from(pushSendEvents)
      .where(
        and(
          eq(pushSendEvents.status, "failure"),
          eq(pushSendEvents.kind, "auth"),
        ),
      )
      .orderBy(desc(pushSendEvents.at))
      .limit(1);
    if (lastAuthRow?.at) {
      lastAuthFailure = {
        at: lastAuthRow.at.getTime(),
        statusCode: lastAuthRow.statusCode,
        kind: "auth",
      };
    }
  } catch (err) {
    console.warn(
      "[pushService] Falha ao ler histórico de eventos push:",
      (err as Error)?.message || err,
    );
  }

  const lastAuthIsRecent =
    !!lastAuthFailure && now - lastAuthFailure.at < RECENT_WINDOW_MS;
  const lastSuccessAfterAuth =
    !!lastSuccessAt && !!lastAuthFailure && lastSuccessAt > lastAuthFailure.at;
  const hasActiveVapidProblem =
    !pushEnabled ||
    (lastAuthIsRecent && !lastSuccessAfterAuth) ||
    recentAuthFailureCount > 0;

  const recentTotalCount = recentSuccessCount + recentFailureCount;
  const recentFailureRate =
    recentTotalCount > 0 ? recentFailureCount / recentTotalCount : 0;

  // The high-failure-rate alert auto-clears as soon as recent successes pull
  // the ratio (and/or count) below the configured thresholds, so no manual
  // dismissal is needed.
  const hasHighFailureRate =
    pushEnabled &&
    recentFailureCount >= FAILURE_ALERT_MIN_COUNT &&
    recentFailureRate >= FAILURE_ALERT_RATE;

  return {
    enabled: pushEnabled,
    configError: vapidConfigError,
    totals: { sent: totalSent, failed: totalFailed, authFailed: totalAuthFailed },
    lastSuccessAt,
    lastFailure,
    lastAuthFailure,
    recentWindowMinutes: Math.round(RECENT_WINDOW_MS / 60000),
    recentSuccessCount,
    recentFailureCount,
    recentAuthFailureCount,
    recentTotalCount,
    recentFailureRate,
    failureAlertMinCount: FAILURE_ALERT_MIN_COUNT,
    failureAlertRate: FAILURE_ALERT_RATE,
    hasActiveVapidProblem,
    hasHighFailureRate,
  };
}

export class InvalidPushEndpointError extends Error {
  constructor(message = "Endpoint de push não pertence a um serviço suportado") {
    super(message);
    this.name = "InvalidPushEndpointError";
  }
}

export async function saveSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  deviceInfo?: string
): Promise<void> {
  // Defense-in-depth: routes already validate, but enforce here too so any
  // future caller can't accidentally bypass the SSRF allowlist.
  if (!isAllowedPushEndpoint(subscription.endpoint)) {
    throw new InvalidPushEndpointError();
  }
  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      deviceInfo: deviceInfo || null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceInfo: deviceInfo || null,
      },
    });
}

export async function removeSubscription(endpoint: string, userId?: string): Promise<void> {
  if (userId) {
    await db.delete(pushSubscriptions).where(
      and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId))
    );
  } else {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}

const MAX_SEND_ATTEMPTS = parsePositiveIntEnv("PUSH_MAX_SEND_ATTEMPTS", 2);
const RETRY_BASE_DELAY_MS = parseNonNegativeIntEnv(
  "PUSH_RETRY_BASE_DELAY_MS",
  500,
);

function isTransientPushError(err: any): boolean {
  const statusCode = err?.statusCode;
  if (typeof statusCode === "number") {
    return statusCode >= 500 && statusCode < 600;
  }
  const code = err?.code;
  if (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "EPIPE" ||
    code === "UND_ERR_SOCKET" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "UND_ERR_HEADERS_TIMEOUT" ||
    code === "UND_ERR_BODY_TIMEOUT"
  ) {
    return true;
  }
  const name = err?.name;
  if (name === "TimeoutError" || name === "AbortError") return true;
  const message = typeof err?.message === "string" ? err.message.toLowerCase() : "";
  if (message.includes("timeout") || message.includes("timed out")) return true;
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
    appointmentId?: number;
    actions?: { action: string; title: string }[];
  }
): Promise<{ sent: number; failed: number }> {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const endpointPreview =
      sub.endpoint.length > 80
        ? `${sub.endpoint.slice(0, 60)}...${sub.endpoint.slice(-16)}`
        : sub.endpoint;

    // SSRF guard: skip and purge any stored subscription whose endpoint
    // is no longer (or never was) on the allowlist of trusted push services.
    if (!isAllowedPushEndpoint(sub.endpoint)) {
      console.warn(
        `[pushService] A descartar subscrição com endpoint não permitido para userId=${userId} endpoint=${endpointPreview}.`,
      );
      try {
        await removeSubscription(sub.endpoint);
      } catch (err) {
        console.warn(
          `[pushService] Falha a remover subscrição não permitida: ${(err as Error)?.message || err}`,
        );
      }
      failed++;
      await recordSendEvent({
        status: "failure",
        endpointPreview,
        statusCode: null,
        kind: "other",
        message: "endpoint not in allowlist",
      });
      continue;
    }

    let lastError: any = null;
    let delivered = false;

    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        delivered = true;
        if (attempt > 1) {
          console.info(
            `[pushService] Reenvio bem-sucedido (tentativa ${attempt}/${MAX_SEND_ATTEMPTS}) para userId=${userId} endpoint=${endpointPreview}.`,
          );
        }
        break;
      } catch (err: any) {
        lastError = err;
        const transient = isTransientPushError(err);
        if (transient && attempt < MAX_SEND_ATTEMPTS) {
          const waitMs = RETRY_BASE_DELAY_MS * attempt;
          const statusCode = err?.statusCode;
          console.warn(
            `[pushService] Erro transiente ao enviar push (tentativa ${attempt}/${MAX_SEND_ATTEMPTS}) para userId=${userId} endpoint=${endpointPreview} statusCode=${statusCode ?? "n/a"}. A retentar em ${waitMs}ms.`,
          );
          await delay(waitMs);
          continue;
        }
        break;
      }
    }

    if (delivered) {
      sent++;
      await recordSendEvent({
        status: "success",
        endpointPreview,
        statusCode: null,
        kind: null,
        message: null,
      });
      continue;
    }

    const err = lastError;
    const statusCode = err?.statusCode;
    const errorBody =
      typeof err?.body === "string"
        ? err.body.slice(0, 500)
        : err?.body
          ? JSON.stringify(err.body).slice(0, 500)
          : err?.message || String(err);

    let kind: FailureKind = "other";
    if (statusCode === 410 || statusCode === 404) {
      kind = "gone";
      await removeSubscription(sub.endpoint);
      console.info(
        `[pushService] Subscrição removida (${statusCode}) para userId=${userId} endpoint=${endpointPreview}. Detalhe: ${errorBody}`,
      );
    } else if (statusCode === 401 || statusCode === 403) {
      kind = "auth";
      console.error(
        `[pushService] FALHA DE AUTENTICAÇÃO VAPID (${statusCode}) ao enviar push para userId=${userId} endpoint=${endpointPreview}. ` +
          `Verifica os Secrets VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY (e VAPID_EMAIL): provavelmente as chaves estão erradas, desemparelhadas ou foram regeradas. ` +
          `Detalhe: ${errorBody}`,
      );
    } else {
      console.warn(
        `[pushService] Falha ao enviar push para userId=${userId} endpoint=${endpointPreview} statusCode=${statusCode ?? "n/a"} (após ${MAX_SEND_ATTEMPTS} tentativa(s)). Detalhe: ${errorBody}`,
      );
    }
    failed++;
    await recordSendEvent({
      status: "failure",
      endpointPreview,
      statusCode: typeof statusCode === "number" ? statusCode : null,
      kind,
      message: errorBody,
    });
  }

  return { sent, failed };
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
