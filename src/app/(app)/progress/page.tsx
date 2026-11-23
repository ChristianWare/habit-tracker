import Link from "next/link";
import PageIntro from "@/components/PageIntro/PageIntro";
import {
  MoodChart,
  WeightChart,
  type MoodPoint,
} from "@/components/Progress/Charts";
import { db } from "@/lib/db";
import {
  getCategories,
  getFoodDays,
  getGoals,
  getHabits,
  getLogs,
  getMoods,
} from "@/lib/data";
import {
  addDays,
  eachDay,
  minYmd,
  monthStart,
  quarterStart,
  shortDate,
  today,
  weekStart,
  yearStart,
  weekday,
  WEEKDAYS_SHORT,
  type Ymd,
} from "@/lib/dates";
import { dayCompletion, indexLogs, rateFor, streakFor } from "@/lib/habits";
import styles from "@/components/Progress/Progress.module.css";

export const metadata = { title: "Progress" };

const RANGES = {
  week: { label: "This week", start: weekStart },
  month: { label: "This month", start: monthStart },
  quarter: { label: "This quarter", start: quarterStart },
  year: { label: "This year", start: yearStart },
} as const;

type RangeKey = keyof typeof RANGES;

const pct = (done: number, expected: number) =>
  expected ? Math.round((done / expected) * 100) : null;

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;
  const range: RangeKey = r && r in RANGES ? (r as RangeKey) : "month";
  const d = today();
  const from = RANGES[range].start(d);
  const to = d;
  const lookback = addDays(minYmd(from, d), -400);

  const [categories, habits, logs, foodDays, moods, goals, food] =
    await Promise.all([
      getCategories(),
      getHabits(),
      getLogs(lookback, to),
      getFoodDays(lookback, to),
      getMoods(from, to),
      getGoals(),
      db.foodEntry.groupBy({
        by: ["date"],
        where: { date: { gte: from, lte: to } },
        _sum: { calories: true, protein: true },
      }),
    ]);

  const idx = indexLogs(logs);
  const moodBy = new Map(moods.map((m) => [m.date, m.score]));
  const days = eachDay(from, to);

  // ── Per habit and per category ──
  const perHabit = habits
    .map((h) => {
      const rate = rateFor(h, from, to, d, idx, foodDays);
      return { h, rate, streak: streakFor(h, d, idx, foodDays) };
    })
    .filter((x) => x.rate.expected > 0 || !x.h.archivedDay);

  const total = perHabit.reduce(
    (a, x) => ({
      done: a.done + x.rate.done,
      expected: a.expected + x.rate.expected,
    }),
    { done: 0, expected: 0 },
  );

  const perCategory = categories.map((c) => {
    const mine = perHabit.filter((x) => x.h.categoryIds.includes(c.id));
    const done = mine.reduce((n, x) => n + x.rate.done, 0);
    const expected = mine.reduce((n, x) => n + x.rate.expected, 0);
    return { c, done, expected, pct: pct(done, expected) };
  });

  // ── Day by day ──
  const daily = days.map((day) => {
    const comp = dayCompletion(habits, day, idx, foodDays);
    // Today only counts once it's done or the day is over.
    const counted = day < d || (comp.pct === 1 && comp.due > 0);
    return {
      day,
      pct: counted ? comp.pct : null,
      mood: moodBy.get(day) ?? null,
    };
  });
  const perfect = daily.filter((x) => x.pct === 1).length;
  const moodVals = daily
    .map((x) => x.mood)
    .filter((m): m is number => m != null);
  const avgMood = moodVals.length
    ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length
    : null;

  // Weekly points for long ranges, daily for short ones.
  let points: MoodPoint[];
  if (range === "week" || range === "month") {
    points = daily.map((x) => ({
      label:
        range === "week"
          ? WEEKDAYS_SHORT[weekday(x.day)]
          : String(Number(x.day.slice(8))),
      done: x.pct == null ? null : Math.round(x.pct * 100),
      mood: x.mood,
    }));
  } else {
    const weeks = new Map<Ymd, typeof daily>();
    for (const x of daily) {
      const w = weekStart(x.day);
      if (!weeks.has(w)) weeks.set(w, []);
      weeks.get(w)!.push(x);
    }
    points = [...weeks].map(([w, list]) => {
      const p = list.map((x) => x.pct).filter((v): v is number => v != null);
      const m = list.map((x) => x.mood).filter((v): v is number => v != null);
      return {
        label: shortDate(w),
        done: p.length
          ? Math.round((p.reduce((a, b) => a + b, 0) / p.length) * 100)
          : null,
        mood: m.length
          ? Number((m.reduce((a, b) => a + b, 0) / m.length).toFixed(1))
          : null,
      };
    });
  }

  // Do good days feel better? Mood on strong days against weak ones.
  const strong = daily
    .filter((x) => x.mood != null && x.pct != null && x.pct >= 0.8)
    .map((x) => x.mood!);
  const weak = daily
    .filter((x) => x.mood != null && x.pct != null && x.pct < 0.5)
    .map((x) => x.mood!);
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const insight =
    strong.length >= 3 && weak.length >= 3
      ? { strong: avg(strong), weak: avg(weak), n: strong.length + weak.length }
      : null;

  // ── Weight and food ──
  const weightHabit = habits.find(
    (h) => h.kind === "NUMBER" && h.unit === "lbs",
  );
  const weights = weightHabit
    ? logs
        .filter(
          (l) =>
            l.habitId === weightHabit.id && l.value != null && l.date >= from,
        )
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((l) => ({ label: shortDate(l.date), weight: l.value! }))
    : [];
  const change =
    weights.length >= 2
      ? weights[weights.length - 1].weight - weights[0].weight
      : null;
  const loggedDays = food.length;
  const avgCals = loggedDays
    ? food.reduce((n, f) => n + (f._sum.calories ?? 0), 0) / loggedDays
    : null;
  const avgProtein = loggedDays
    ? food.reduce((n, f) => n + (f._sum.protein ?? 0), 0) / loggedDays
    : null;

  const overall = pct(total.done, total.expected);

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow={`${shortDate(from)} – ${shortDate(to)}`}
        heading='Progress'
        copy='How the week, month, quarter or year is going, and whether your best days are also your happiest.'
        kpis={[
          {
            label: "Habits done",
            value: overall == null ? "—" : `${overall}%`,
            sub: `${total.done} of ${total.expected}`,
            accent: (overall ?? 0) >= 80,
          },
          {
            label: "Perfect days",
            value: perfect,
            sub: `of ${daily.filter((x) => x.pct != null).length}`,
          },
          {
            label: "Average mood",
            value: avgMood ? avgMood.toFixed(1) : "—",
            sub: moodVals.length
              ? `${moodVals.length} check-ins`
              : "No check-ins yet",
          },
          {
            label: "Average calories",
            value: avgCals ? Math.round(avgCals).toLocaleString() : "—",
            sub: `goal ${goals.calories.toLocaleString()}`,
          },
        ]}
      />

      <nav className={styles.ranges} aria-label='Period'>
        {(Object.keys(RANGES) as RangeKey[]).map((k) => (
          <Link
            key={k}
            href={`/progress?r=${k}`}
            className={`${styles.range} ${k === range ? styles.rangeOn : ""}`}
            aria-current={k === range ? "page" : undefined}
          >
            {RANGES[k].label}
          </Link>
        ))}
      </nav>

      <div className={styles.columns}>
        <div className={styles.stack}>
          <section className='panel'>
            <h2 className='cardTitle'>
              Mood and habits
              <small>
                {range === "quarter" || range === "year"
                  ? "Weekly averages"
                  : "Day by day"}
              </small>
            </h2>
            {moodVals.length || total.expected ? (
              <>
                <MoodChart data={points} />
                <div className={styles.legend}>
                  <span>
                    <span className={styles.swatchBar} /> Habits done (%)
                  </span>
                  <span>
                    <span className={styles.swatchLine} /> Mood (1–10)
                  </span>
                </div>
              </>
            ) : (
              <p className='empty'>
                Check off habits and log your mood on Today, and this fills in.
              </p>
            )}
            {insight ? (
              <p className={styles.insight}>
                On days you did 80% or more, your mood averaged{" "}
                <strong>{insight.strong.toFixed(1)}</strong>. On days under 50%,
                it averaged <strong>{insight.weak.toFixed(1)}</strong>.{" "}
                {insight.strong - insight.weak >= 0.5
                  ? "Getting things done does seem to lift you."
                  : insight.weak - insight.strong >= 0.5
                    ? "Interesting: your mood held up even on lighter days."
                    : "So far, your mood is about the same either way."}
              </p>
            ) : (
              <p className='miniNote'>
                After a few strong days and a few lighter ones with a mood
                logged, you&apos;ll see how they compare here.
              </p>
            )}
          </section>

          <section className='panel'>
            <h2 className='cardTitle'>By habit</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Habit</th>
                  <th className={styles.num}>Done</th>
                  <th className={styles.num}>Rate</th>
                  <th className={styles.num}>Streak</th>
                </tr>
              </thead>
              <tbody>
                {perHabit
                  .filter((x) => x.rate.expected > 0)
                  .sort(
                    (a, b) =>
                      (pct(b.rate.done, b.rate.expected) ?? 0) -
                      (pct(a.rate.done, a.rate.expected) ?? 0),
                  )
                  .map(({ h, rate, streak }) => (
                    <tr key={h.id}>
                      <td>{h.name}</td>
                      <td className={styles.num}>
                        {rate.done}/{rate.expected}
                      </td>
                      <td className={styles.num}>
                        {pct(rate.done, rate.expected)}%
                      </td>
                      <td className={styles.num}>
                        {streak.count
                          ? `${streak.count} ${streak.unit}${streak.count === 1 ? "" : "s"}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!perHabit.some((x) => x.rate.expected > 0) ? (
              <p className='empty'>Nothing was due yet in this period.</p>
            ) : null}
          </section>
        </div>

        <div className={styles.stack}>
          <section className='panel'>
            <h2 className='cardTitle'>By category</h2>
            <div className={styles.catRows}>
              {perCategory.map(({ c, done, expected, pct: p }) => (
                <div key={c.id} className={styles.catRow}>
                  <div className={styles.catTop}>
                    <span className={styles.catName}>
                      <span
                        className='dot'
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                    <span>
                      <span className={styles.catPct}>
                        {p == null ? "—" : `${p}%`}
                      </span>{" "}
                      <span className='miniNote'>
                        {done}/{expected}
                      </span>
                    </span>
                  </div>
                  <div className={styles.track}>
                    <span
                      style={{ width: `${p ?? 0}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className='miniNote'>
              A habit in two categories counts toward both.
            </p>
          </section>

          <section className='panel'>
            <h2 className='cardTitle'>
              Weight
              <small>
                {change != null
                  ? `${change > 0 ? "+" : ""}${change.toFixed(1)} lbs this period`
                  : ""}
              </small>
            </h2>
            {weights.length >= 2 ? (
              <WeightChart data={weights} />
            ) : (
              <p className='empty'>
                Log your weight on Today a few times to see the trend.
              </p>
            )}
          </section>

          <section className='panel'>
            <h2 className='cardTitle'>Food</h2>
            <p className='miniNote'>
              {loggedDays
                ? `${loggedDays} day${loggedDays === 1 ? "" : "s"} logged. Average ${Math.round(avgCals!).toLocaleString()} calories (goal ${goals.calories.toLocaleString()}) and ${Math.round(avgProtein!)} g protein (goal ${goals.protein} g).`
                : "No food logged in this period."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
