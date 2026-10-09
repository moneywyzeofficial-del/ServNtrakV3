import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ServerCrash } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export type PushFailureSummary = {
  at: number;
  statusCode: number | null;
  kind: "auth" | "gone" | "other";
};

export type PushHealth = {
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
  recentFailureRate: number;
  failureAlertMinCount: number;
  failureAlertRate: number;
  hasActiveVapidProblem: boolean;
  hasHighFailureRate: boolean;
};

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} d`;
}

type Variant = "compact" | "prominent";

type Props = {
  variant?: Variant;
};

/**
 * Visual alert that surfaces the push notification health endpoint.
 *
 * Renders nothing while healthy. Auto-dismisses (no manual action) once the
 * push service starts succeeding again, because the underlying flags
 * (`hasActiveVapidProblem`, `hasHighFailureRate`) are recomputed from the
 * latest send events on every poll.
 */
export function PushHealthBanner({ variant = "compact" }: Props) {
  const { data: health } = useQuery<PushHealth>({
    queryKey: ["/api/push/health"],
    refetchInterval: 60_000,
  });

  if (!health) return null;

  const showConfig = !health.enabled;
  // Use the backend-computed flag for the auth-failure case so the banner
  // criteria stay in lock-step with the server (avoids drift).
  const showAuth =
    health.enabled && health.hasActiveVapidProblem && !!health.lastAuthFailure;
  const showHighRate =
    health.enabled && health.hasHighFailureRate && !showAuth;

  if (!showConfig && !showAuth && !showHighRate) return null;

  const isProminent = variant === "prominent";
  const wrapperBase = isProminent
    ? "rounded-2xl border-2 border-destructive/60 bg-destructive/15 p-4 flex gap-3 shadow-sm"
    : "rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex gap-3";
  const iconClass = isProminent
    ? "w-6 h-6 text-destructive shrink-0 mt-0.5"
    : "w-5 h-5 text-destructive shrink-0 mt-0.5";
  const titleClass = isProminent
    ? "font-semibold text-sm text-destructive"
    : "font-semibold text-xs text-destructive";
  const bodyClass = isProminent
    ? "text-xs text-destructive/90 mt-1 leading-relaxed"
    : "text-xs text-destructive/80 mt-1";

  if (showConfig) {
    return (
      <div className={wrapperBase} data-testid="alert-push-config-error">
        <AlertTriangle className={iconClass} />
        <div className="flex-1">
          <p className={titleClass}>Notificações push desativadas no servidor</p>
          <p className={bodyClass}>
            {health.configError || "Configuração VAPID em falta ou inválida."}
          </p>
          <p className={bodyClass}>
            Verifica os Secrets <code className="font-mono">VAPID_PUBLIC_KEY</code>,{" "}
            <code className="font-mono">VAPID_PRIVATE_KEY</code> e{" "}
            <code className="font-mono">VAPID_EMAIL</code>.
          </p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    const last = health.lastAuthFailure!;
    return (
      <div className={wrapperBase} data-testid="alert-push-vapid-failure">
        <AlertTriangle className={iconClass} />
        <div className="flex-1">
          <p className={titleClass} data-testid="text-push-vapid-failure-title">
            Falhas de autenticação VAPID detetadas
          </p>
          <p className={bodyClass}>
            {health.recentAuthFailureCount > 0 ? (
              <>
                <span data-testid="text-push-vapid-failure-count">
                  {health.recentAuthFailureCount}
                </span>
                {" "}falha(s) nos últimos {health.recentWindowMinutes} min.
              </>
            ) : (
              <>Última falha {formatRelativeTime(last.at)}.</>
            )}
            {" "}Último erro: HTTP {last.statusCode ?? "?"} ({formatRelativeTime(last.at)}).
          </p>
          <p className={bodyClass}>
            As notificações podem não estar a chegar. Verifica se as chaves{" "}
            <code className="font-mono">VAPID_PUBLIC_KEY</code> /{" "}
            <code className="font-mono">VAPID_PRIVATE_KEY</code> nos Secrets estão emparelhadas e atualizadas,
            e volta a subscrever este dispositivo se necessário.
          </p>
        </div>
      </div>
    );
  }

  // High failure rate (transient/other failures dominating).
  const ratePct = Math.round(health.recentFailureRate * 100);
  const thresholdPct = Math.round(health.failureAlertRate * 100);
  return (
    <div className={wrapperBase} data-testid="alert-push-high-failure-rate">
      <ServerCrash className={iconClass} />
      <div className="flex-1">
        <p className={titleClass} data-testid="text-push-high-failure-title">
          Muitas notificações push estão a falhar
        </p>
        <p className={bodyClass}>
          <span data-testid="text-push-high-failure-count">
            {health.recentFailureCount}
          </span>
          {" "}de{" "}
          <span data-testid="text-push-high-failure-total">
            {health.recentTotalCount}
          </span>
          {" "}envios falharam nos últimos {formatDuration(health.recentWindowMinutes)}{" "}
          (<span data-testid="text-push-high-failure-rate">{ratePct}%</span>,
          {" "}acima do limiar de {thresholdPct}% / {health.failureAlertMinCount} falhas).
          {health.lastFailure && (
            <>
              {" "}Última falha {formatRelativeTime(health.lastFailure.at)}{" "}
              (HTTP {health.lastFailure.statusCode ?? "?"}).
            </>
          )}
        </p>
        <p className={bodyClass}>
          Pode ser indisponibilidade temporária do serviço de push. Este aviso
          desaparece automaticamente assim que os envios voltarem a ter sucesso.
        </p>
      </div>
    </div>
  );
}
