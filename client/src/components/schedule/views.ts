import { lazy } from "react";
import type { LucideIcon } from "lucide-react";
import { ListChecks, CalendarDays, Map as MapIcon } from "lucide-react";
import { ListView } from "./ListView";

const CalendarView = lazy(() =>
  import("./CalendarView").then((m) => ({ default: m.CalendarView })),
);

const MapView = lazy(() =>
  import("./MapView").then((m) => ({ default: m.MapView })),
);

export interface ViewConfig {
  key: string;
  label: string;
  Icon: LucideIcon;
  Component: React.ComponentType;
  /** Optional className override for active tab styling */
  tabClassName?: string;
}

const STORAGE_KEY = "servntrak_schedule_view";

export function loadPersistedView(fallback: string): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

export function persistView(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // localStorage may be unavailable (private browsing, quota, etc.)
  }
}

export const scheduleViews: ViewConfig[] = [
  {
    key: "lista",
    label: "Lista",
    Icon: ListChecks,
    Component: ListView,
  },
  {
    key: "calendario",
    label: "Calendário",
    Icon: CalendarDays,
    Component: CalendarView,
  },
  {
    key: "mapa",
    label: "Mapa",
    Icon: MapIcon,
    Component: MapView,
  },
];
