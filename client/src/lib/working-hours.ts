export interface WorkingHoursSettings {
  start: number;
  end: number;
  lunchEnabled: boolean;
  lunchStart: number;
  lunchEnd: number;
}

export const DEFAULT_WORKING_HOURS: WorkingHoursSettings = {
  start: 8,
  end: 18,
  lunchEnabled: false,
  lunchStart: 12,
  lunchEnd: 14,
};

const CACHE_KEY = "servntrak-working-hours-cache";

function clampHour(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function normalizeSettings(raw: Partial<WorkingHoursSettings> | null | undefined): WorkingHoursSettings {
  const start = clampHour(raw?.start, DEFAULT_WORKING_HOURS.start, 0, 23);
  const endRaw = clampHour(raw?.end, DEFAULT_WORKING_HOURS.end, 0, 23);
  const end = endRaw < start ? start : endRaw;
  const lunchStart = clampHour(raw?.lunchStart, DEFAULT_WORKING_HOURS.lunchStart, 0, 23);
  const lunchEndRaw = clampHour(raw?.lunchEnd, DEFAULT_WORKING_HOURS.lunchEnd, 1, 24);
  const lunchEnd = lunchEndRaw <= lunchStart ? lunchStart + 1 : lunchEndRaw;
  return {
    start,
    end,
    lunchEnabled: Boolean(raw?.lunchEnabled),
    lunchStart,
    lunchEnd,
  };
}

export interface WorkingHoursDTO {
  workingHoursStart: number;
  workingHoursEnd: number;
  lunchEnabled: boolean;
  lunchStart: number;
  lunchEnd: number;
  hasPreferences?: boolean;
}

export function settingsEqual(a: WorkingHoursSettings, b: WorkingHoursSettings): boolean {
  return (
    a.start === b.start &&
    a.end === b.end &&
    a.lunchEnabled === b.lunchEnabled &&
    a.lunchStart === b.lunchStart &&
    a.lunchEnd === b.lunchEnd
  );
}

export function fromDTO(dto: WorkingHoursDTO): WorkingHoursSettings {
  return normalizeSettings({
    start: dto.workingHoursStart,
    end: dto.workingHoursEnd,
    lunchEnabled: dto.lunchEnabled,
    lunchStart: dto.lunchStart,
    lunchEnd: dto.lunchEnd,
  });
}

export function toDTO(s: WorkingHoursSettings): WorkingHoursDTO {
  return {
    workingHoursStart: s.start,
    workingHoursEnd: s.end,
    lunchEnabled: s.lunchEnabled,
    lunchStart: s.lunchStart,
    lunchEnd: s.lunchEnd,
  };
}

interface CacheEntry {
  userId: string;
  settings: WorkingHoursSettings;
}

export function readCachedSettings(userId: string | null | undefined): WorkingHoursSettings | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    if (parsed?.userId !== userId || !parsed.settings) return null;
    return normalizeSettings(parsed.settings);
  } catch {
    return null;
  }
}

export function writeCachedSettings(
  userId: string | null | undefined,
  settings: WorkingHoursSettings
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const entry: CacheEntry = { userId, settings };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

export function computeWorkingHours(settings: WorkingHoursSettings): number[] {
  const out: number[] = [];
  for (let h = settings.start; h <= settings.end; h++) {
    if (settings.lunchEnabled && h >= settings.lunchStart && h < settings.lunchEnd) continue;
    out.push(h);
  }
  return out;
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
