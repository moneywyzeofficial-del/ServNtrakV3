import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";

export const WORKING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export function suggestSameDayHours(
  selectedDate: Date,
  occupiedHours: Set<number>,
  pivotHour: number,
  workingHours: number[] = WORKING_HOURS,
  limit = 3,
): number[] {
  return workingHours
    .filter((h) => !occupiedHours.has(h))
    .sort(
      (a, b) => Math.abs(a - pivotHour) - Math.abs(b - pivotHour) || a - b,
    )
    .slice(0, limit)
    .sort((a, b) => a - b);
}

export interface NextDaySlot {
  date: Date;
  label: string;
  key: string;
}

export function getFreeHoursForDay(
  day: Date,
  occupiedDates: Date[],
  workingHours: number[] = WORKING_HOURS,
): number[] {
  const occupiedSameDay = new Set(
    occupiedDates
      .filter((d) => isSameDay(d, day))
      .map((d) => d.getHours()),
  );
  return workingHours
    .filter((h) => !occupiedSameDay.has(h))
    .sort((a, b) => a - b);
}

export function suggestNextDaySlots(
  selectedDate: Date,
  occupiedDates: Date[],
  options: {
    workingHours?: number[];
    maxSuggestions?: number;
    maxDaysAhead?: number;
  } = {},
): NextDaySlot[] {
  const workingHours = options.workingHours ?? WORKING_HOURS;
  const maxSuggestions = options.maxSuggestions ?? 2;
  const maxDaysAhead = options.maxDaysAhead ?? 4;

  const slots: NextDaySlot[] = [];
  for (
    let daysAhead = 1;
    daysAhead <= maxDaysAhead && slots.length < maxSuggestions;
    daysAhead++
  ) {
    const nextDay = addDays(startOfDay(selectedDate), daysAhead);
    const weekday = nextDay.getDay();
    if (weekday === 0 || weekday === 6) continue;

    const occupiedNextDay = new Set(
      occupiedDates
        .filter((d) => isSameDay(d, nextDay))
        .map((d) => d.getHours()),
    );
    const freeNextDay = workingHours.filter((h) => !occupiedNextDay.has(h));
    for (const h of freeNextDay) {
      if (slots.length >= maxSuggestions) break;
      const slotDate = new Date(nextDay);
      slotDate.setHours(h, 0, 0, 0);
      const hourLabel = `${String(h).padStart(2, "0")}:00`;
      const label =
        daysAhead === 1
          ? `Amanhã ${hourLabel}`
          : `${format(slotDate, "EEE d", { locale: pt })} — ${hourLabel}`;
      slots.push({
        date: slotDate,
        label,
        key: `${format(slotDate, "yyyy-MM-dd")}-${h}`,
      });
    }
  }
  return slots;
}
