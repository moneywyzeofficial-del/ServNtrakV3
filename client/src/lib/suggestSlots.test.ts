import assert from "node:assert/strict";
import { addDays, format, startOfDay } from "date-fns";
import {
  WORKING_HOURS,
  getFreeHoursForDay,
  suggestNextDaySlots,
  suggestSameDayHours,
} from "./suggestSlots";

function nextWeekday(start: Date): Date {
  let d = startOfDay(start);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d = addDays(d, 1);
  }
  return d;
}

function fillDay(day: Date, hours: number[] = WORKING_HOURS): Date[] {
  return hours.map((h) => {
    const d = new Date(day);
    d.setHours(h, 0, 0, 0);
    return d;
  });
}

function failures(): string[] {
  return [];
}

const errors = failures();
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    errors.push(`${name}: ${(err as Error).message}`);
    console.error(`  FAIL ${name}: ${(err as Error).message}`);
  }
}

console.log("suggestSameDayHours");

check("returns up to 3 free hours sorted ascending, prioritised by proximity", () => {
  const day = nextWeekday(new Date());
  const occupied = new Set([8, 9, 10, 11, 12]);
  const result = suggestSameDayHours(day, occupied, 13);
  assert.deepEqual(result, [13, 14, 15]);
});

check("returns empty when every working hour is occupied", () => {
  const day = nextWeekday(new Date());
  const occupied = new Set(WORKING_HOURS);
  const result = suggestSameDayHours(day, occupied, 10);
  assert.deepEqual(result, []);
});

console.log("suggestNextDaySlots");

check("suggests Amanhã when next day is a weekday and free", () => {
  const today = startOfDay(new Date());
  let target = today;
  while (target.getDay() === 5 || target.getDay() === 6 || target.getDay() === 0) {
    target = addDays(target, 1);
  }
  const slots = suggestNextDaySlots(target, []);
  assert.equal(slots.length, 2);
  assert.match(slots[0].label, /^Amanhã 08:00$/);
  assert.match(slots[1].label, /^Amanhã 09:00$/);
  const expectedNext = addDays(target, 1);
  assert.equal(slots[0].date.getDate(), expectedNext.getDate());
  assert.equal(slots[0].date.getHours(), 8);
});

check("avoids hours already occupied on the next day", () => {
  const today = startOfDay(new Date());
  let target = today;
  while (target.getDay() === 5 || target.getDay() === 6 || target.getDay() === 0) {
    target = addDays(target, 1);
  }
  const nextDay = addDays(target, 1);
  const occupiedNext = fillDay(nextDay, [8, 9, 10]);
  const slots = suggestNextDaySlots(target, occupiedNext);
  assert.equal(slots.length, 2);
  assert.equal(slots[0].date.getHours(), 11);
  assert.equal(slots[1].date.getHours(), 12);
});

check("skips weekends — Friday jumps to Monday with weekday label", () => {
  let friday = startOfDay(new Date());
  while (friday.getDay() !== 5) {
    friday = addDays(friday, 1);
  }
  const slots = suggestNextDaySlots(friday, []);
  assert.equal(slots.length, 2);
  const monday = addDays(friday, 3);
  assert.equal(slots[0].date.getDay(), 1, "should be Monday");
  assert.equal(slots[0].date.getDate(), monday.getDate());
  assert.match(
    slots[0].label,
    /^[A-Za-zÀ-ÿ]{3}\.? \d{1,2} — 08:00$/,
    `unexpected label: ${slots[0].label}`,
  );
});

check("returns up to 2 suggestions even when many hours are free", () => {
  const today = startOfDay(new Date());
  let target = today;
  while (target.getDay() === 5 || target.getDay() === 6 || target.getDay() === 0) {
    target = addDays(target, 1);
  }
  const slots = suggestNextDaySlots(target, []);
  assert.equal(slots.length, 2);
});

check("returns empty when next 4 days are all weekends or full (impossible scenario sanity)", () => {
  const today = startOfDay(new Date());
  let target = today;
  while (target.getDay() === 5 || target.getDay() === 6 || target.getDay() === 0) {
    target = addDays(target, 1);
  }
  // Fill the next 4 days entirely
  const occupied: Date[] = [];
  for (let i = 1; i <= 4; i++) {
    occupied.push(...fillDay(addDays(target, i)));
  }
  const slots = suggestNextDaySlots(target, occupied);
  assert.equal(slots.length, 0);
});

check("keys are unique and date-stamped", () => {
  const today = startOfDay(new Date());
  let target = today;
  while (target.getDay() === 5 || target.getDay() === 6 || target.getDay() === 0) {
    target = addDays(target, 1);
  }
  const slots = suggestNextDaySlots(target, []);
  const expectedDate = format(addDays(target, 1), "yyyy-MM-dd");
  assert.equal(slots[0].key, `${expectedDate}-8`);
  assert.equal(slots[1].key, `${expectedDate}-9`);
  assert.notEqual(slots[0].key, slots[1].key);
});

console.log("getFreeHoursForDay");

check("returns all working hours when nothing is occupied", () => {
  const day = nextWeekday(new Date());
  const result = getFreeHoursForDay(day, []);
  assert.deepEqual(result, [...WORKING_HOURS].sort((a, b) => a - b));
});

check("excludes occupied hours on the same day, ignoring other days", () => {
  const day = nextWeekday(new Date());
  const otherDay = addDays(day, 1);
  const occupied = [
    ...fillDay(day, [9, 12, 15]),
    ...fillDay(otherDay, [10, 11]),
  ];
  const result = getFreeHoursForDay(day, occupied);
  assert.deepEqual(
    result,
    WORKING_HOURS.filter((h) => ![9, 12, 15].includes(h)),
  );
});

check("respects custom working hours", () => {
  const day = nextWeekday(new Date());
  const occupied = fillDay(day, [10]);
  const result = getFreeHoursForDay(day, occupied, [9, 10, 11]);
  assert.deepEqual(result, [9, 11]);
});

check("returns empty when every working hour is occupied", () => {
  const day = nextWeekday(new Date());
  const occupied = fillDay(day, WORKING_HOURS);
  const result = getFreeHoursForDay(day, occupied);
  assert.deepEqual(result, []);
});

if (errors.length > 0) {
  console.error(`\n${errors.length} test(s) failed`);
  process.exit(1);
}
console.log(`\nAll tests passed.`);
