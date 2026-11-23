// What a habit expects and how it's going: due days, weekly targets,
// streaks, completion rates and the meat rotation. Pure functions over
// plain data, used by Today, the calendar and Progress alike.

import {
  addDays,
  daysBetween,
  maxYmd,
  minYmd,
  weekday,
  weekStart,
  type Ymd,
} from "./dates";

export type HabitKind = "CHECK" | "NUMBER" | "FOOD_LOG";
export type ScheduleType = "DAYS" | "WEEKLY_COUNT";

export type HabitLite = {
  id: string;
  name: string;
  notes: string | null;
  kind: HabitKind;
  unit: string | null;
  target: number | null;
  schedule: ScheduleType;
  daysOfWeek: number[];
  timesPerWeek: number | null;
  dayNotes: Record<string, string> | null;
  group: string | null;
  meatRule: boolean;
  startDate: Ymd;
  /** The first day it no longer counts, or null. */
  archivedDay: Ymd | null;
  categoryId: string;
  categoryIds: string[];
  sortOrder: number;
};

export type LogLite = {
  habitId: string;
  date: Ymd;
  done: boolean;
  value: number | null;
  plannedMeal: boolean;
};

/** Looks up one habit's log on one day. */
export type LogIndex = Map<string, LogLite>;

export function logKey(habitId: string, date: Ymd) {
  return `${habitId}|${date}`;
}

export function indexLogs(logs: LogLite[]): LogIndex {
  const m: LogIndex = new Map();
  for (const l of logs) m.set(logKey(l.habitId, l.date), l);
  return m;
}

export function isActiveOn(h: HabitLite, d: Ymd): boolean {
  return d >= h.startDate && (!h.archivedDay || d < h.archivedDay);
}

/** Due that day: an active day-of-week habit on one of its days. Weekly
 *  targets are never "due" on a given day (see weeklyProgress). */
export function isScheduledOn(h: HabitLite, d: Ymd): boolean {
  if (!isActiveOn(h, d)) return false;
  if (h.schedule === "WEEKLY_COUNT") return false;
  return h.daysOfWeek.includes(weekday(d));
}

/** Shown on Today: due today, or a weekly target with days left. */
export function showsOn(h: HabitLite, d: Ymd): boolean {
  if (!isActiveOn(h, d)) return false;
  if (h.schedule === "WEEKLY_COUNT") return true;
  return h.daysOfWeek.includes(weekday(d));
}

/** Whether the habit counts as done on a day. */
export function isDoneOn(
  h: HabitLite,
  d: Ymd,
  logs: LogIndex,
  foodDays: Set<Ymd>,
): boolean {
  if (h.kind === "FOOD_LOG") return foodDays.has(d);
  const log = logs.get(logKey(h.id, d));
  if (!log) return false;
  if (h.kind === "NUMBER") {
    if (log.value == null) return false;
    return h.target == null ? true : log.value >= h.target;
  }
  return log.done;
}

/** Marked as missed on purpose (a log that says not done). */
export function isMissedOn(h: HabitLite, d: Ymd, logs: LogIndex): boolean {
  if (h.kind !== "CHECK") return false;
  const log = logs.get(logKey(h.id, d));
  return !!log && !log.done;
}

/** A weekly-target habit's count for the week the day is in. */
export function weeklyProgress(
  h: HabitLite,
  d: Ymd,
  logs: LogIndex,
  foodDays: Set<Ymd>,
) {
  const start = weekStart(d);
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    if (isActiveOn(h, day) && isDoneOn(h, day, logs, foodDays)) done++;
  }
  return { done, target: h.timesPerWeek ?? 1 };
}

/** The weekday's focus note, e.g. "Kitchen" on Mondays. */
export function dayNote(h: HabitLite, d: Ymd): string | null {
  const n = h.dayNotes?.[String(weekday(d))];
  return n && n.trim() ? n.trim() : null;
}

/**
 * Expected and done across a period, up to today. A day-of-week habit
 * expects each of its days (today only once it's done, so an unfinished
 * today isn't a miss yet). A weekly target expects its count for each
 * finished week, and for the current week only what's done so far.
 */
export function rateFor(
  h: HabitLite,
  from: Ymd,
  to: Ymd,
  todayYmd: Ymd,
  logs: LogIndex,
  foodDays: Set<Ymd>,
) {
  let expected = 0;
  let done = 0;
  const end = minYmd(to, todayYmd);
  if (end < from) return { expected, done };

  if (h.schedule === "DAYS") {
    for (let d = maxYmd(from, h.startDate); d <= end; d = addDays(d, 1)) {
      if (!isScheduledOn(h, d)) continue;
      const ok = isDoneOn(h, d, logs, foodDays);
      if (d === todayYmd && !ok) continue;
      expected++;
      if (ok) done++;
    }
    return { expected, done };
  }

  // Weekly target: whole weeks that overlap the period.
  const target = h.timesPerWeek ?? 1;
  for (let w = weekStart(from); w <= end; w = addDays(w, 7)) {
    const weekEnd = addDays(w, 6);
    if (weekEnd < h.startDate) continue;
    if (h.archivedDay && w >= h.archivedDay) continue;
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(w, i);
      if (d > end) break;
      if (isActiveOn(h, d) && isDoneOn(h, d, logs, foodDays)) count++;
    }
    const finished = weekEnd < todayYmd;
    const capped = Math.min(count, target);
    expected += finished ? target : capped;
    done += capped;
  }
  return { expected, done };
}

/**
 * Current streak: scheduled days in a row that were done, counting back
 * from today (an unfinished today doesn't break it). Weekly targets count
 * weeks in a row that hit the target.
 */
export function streakFor(
  h: HabitLite,
  todayYmd: Ymd,
  logs: LogIndex,
  foodDays: Set<Ymd>,
): { count: number; unit: "day" | "week" } {
  if (h.schedule === "WEEKLY_COUNT") {
    const target = h.timesPerWeek ?? 1;
    let count = 0;
    let w = weekStart(todayYmd);
    const thisWeek = weeklyProgress(h, w, logs, foodDays);
    if (thisWeek.done >= target) count++;
    for (let i = 0; i < 104; i++) {
      w = addDays(w, -7);
      if (addDays(w, 6) < h.startDate) break;
      if (weeklyProgress(h, w, logs, foodDays).done >= target) count++;
      else break;
    }
    return { count, unit: "week" };
  }

  let count = 0;
  for (let i = 0; i < 730; i++) {
    const d = addDays(todayYmd, -i);
    if (d < h.startDate) break;
    if (!isScheduledOn(h, d)) continue;
    if (isDoneOn(h, d, logs, foodDays)) count++;
    else if (d === todayYmd) continue;
    else break;
  }
  return { count, unit: "day" };
}

/** How much of a day's due list was done. */
export function dayCompletion(
  habits: HabitLite[],
  d: Ymd,
  logs: LogIndex,
  foodDays: Set<Ymd>,
) {
  let due = 0;
  let done = 0;
  for (const h of habits) {
    if (!isScheduledOn(h, d)) continue;
    due++;
    if (isDoneOn(h, d, logs, foodDays)) done++;
  }
  return { due, done, pct: due ? done / due : null };
}

// ── The meat rotation ──────────────────────────────────────────────────
// Weeks run Monday to Sunday, named by the day of the month their Monday
// falls on: days 1–7 red meat, 8–14 fish, 15–21 chicken, 22 on meatless.

export type MeatWeek = {
  /** "Red meat week", "Fish week", "Chicken week", "Meatless week". */
  label: string;
  /** What the planned meal is, or null in a meatless week. */
  meal: "red meat" | "fish" | "chicken" | null;
};

export function meatWeek(d: Ymd): MeatWeek {
  const monday = Number(weekStart(d).slice(8, 10));
  if (monday <= 7) return { label: "Red meat week", meal: "red meat" };
  if (monday <= 14) return { label: "Fish week", meal: "fish" };
  if (monday <= 21) return { label: "Chicken week", meal: "chicken" };
  return { label: "Meatless week", meal: null };
}

/** Whether this week's one planned meal is already used. */
export function plannedMealUsed(h: HabitLite, d: Ymd, logs: LogIndex) {
  const start = weekStart(d);
  for (let i = 0; i < 7; i++) {
    const l = logs.get(logKey(h.id, addDays(start, i)));
    if (l?.plannedMeal) return addDays(start, i);
  }
  return null;
}

// ── Labels ─────────────────────────────────────────────────────────────

const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Every day", "Mon–Fri", "Tue", "3× a week" … */
export function scheduleLabel(h: {
  schedule: ScheduleType;
  daysOfWeek: number[];
  timesPerWeek: number | null;
}): string {
  if (h.schedule === "WEEKLY_COUNT") {
    const n = h.timesPerWeek ?? 1;
    return n === 1 ? "Once a week" : `${n}× a week`;
  }
  const days = [...new Set(h.daysOfWeek)].sort((a, b) => a - b);
  if (days.length === 7) return "Every day";
  if (days.length === 0) return "No days";
  const key = days.join(",");
  if (key === "1,2,3,4,5") return "Mon–Fri";
  if (key === "0,6") return "Weekends";
  // A run of weekdays (Mon–Thu).
  const run = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  if (run && days.length > 2 && days[0] !== 0)
    return `${SHORT[days[0]]}–${SHORT[days[days.length - 1]]}`;
  // Monday first in the list.
  const ordered = [
    ...days.filter((d) => d !== 0),
    ...days.filter((d) => d === 0),
  ];
  return ordered.map((d) => SHORT[d]).join(", ");
}

/** Days until the start date, or 0 once it has started. */
export function daysUntilStart(h: HabitLite, todayYmd: Ymd) {
  return Math.max(0, daysBetween(todayYmd, h.startDate));
}
