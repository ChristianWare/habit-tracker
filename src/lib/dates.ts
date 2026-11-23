// Days are "YYYY-MM-DD" strings in your time zone (APP_TIMEZONE). All the
// arithmetic here works on those strings through UTC noon, so daylight
// saving and the server's own time zone never shift a day.

export const TIMEZONE = process.env.APP_TIMEZONE || "America/Phoenix";

export type Ymd = string;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Monday first, as the app's weeks run. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Today in your time zone. */
export function today(now: Date = new Date()): Ymd {
  return ymdInZone(now);
}

/** The day an instant falls on in your time zone. */
export function ymdInZone(d: Date): Ymd {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function isYmd(s: unknown): s is Ymd {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toUtc(ymd: Ymd): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function fromUtc(d: Date): Ymd {
  return d.toISOString().slice(0, 10);
}

export function addDays(ymd: Ymd, n: number): Ymd {
  const d = toUtc(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

/** Same day n months later, clamped to the month's last day. */
export function addMonths(ymd: Ymd, n: number): Ymd {
  const [y, m, d] = ymd.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  first.setUTCDate(Math.min(d, last));
  return fromUtc(first);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(ymd: Ymd): number {
  return toUtc(ymd).getUTCDay();
}

/** The Monday of the week the day is in. */
export function weekStart(ymd: Ymd): Ymd {
  const wd = weekday(ymd);
  return addDays(ymd, wd === 0 ? -6 : 1 - wd);
}

export function monthStart(ymd: Ymd): Ymd {
  return ymd.slice(0, 8) + "01";
}

export function monthEnd(ymd: Ymd): Ymd {
  return addDays(addMonths(monthStart(ymd), 1), -1);
}

export function quarterStart(ymd: Ymd): Ymd {
  const [y, m] = ymd.split("-").map(Number);
  const qm = Math.floor((m - 1) / 3) * 3 + 1;
  return `${y}-${String(qm).padStart(2, "0")}-01`;
}

export function yearStart(ymd: Ymd): Ymd {
  return ymd.slice(0, 4) + "-01-01";
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: Ymd, b: Ymd): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86400000);
}

/** Every day from a to b, both included. */
export function eachDay(a: Ymd, b: Ymd): Ymd[] {
  const out: Ymd[] = [];
  for (let d = a; d <= b; d = addDays(d, 1)) out.push(d);
  return out;
}

export function minYmd(a: Ymd, b: Ymd): Ymd {
  return a < b ? a : b;
}

export function maxYmd(a: Ymd, b: Ymd): Ymd {
  return a > b ? a : b;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" });
    fmtCache.set(key, f);
  }
  return f;
}

/** "Monday, November 23" */
export function longDate(ymd: Ymd): string {
  return fmt({ weekday: "long", month: "long", day: "numeric" }).format(
    toUtc(ymd),
  );
}

/** "Nov 23" */
export function shortDate(ymd: Ymd): string {
  return fmt({ month: "short", day: "numeric" }).format(toUtc(ymd));
}

/** "Mon, Nov 23" */
export function dayLabel(ymd: Ymd): string {
  return fmt({ weekday: "short", month: "short", day: "numeric" }).format(
    toUtc(ymd),
  );
}

/** "November 2026" */
export function monthLabel(ymd: Ymd): string {
  return fmt({ month: "long", year: "numeric" }).format(toUtc(ymd));
}

/** "Today", "Tomorrow", "Yesterday" or "Mon, Nov 23". */
export function relativeDay(ymd: Ymd, from: Ymd): string {
  const n = daysBetween(from, ymd);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  return dayLabel(ymd);
}
