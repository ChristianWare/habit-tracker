import Link from "next/link";
import PageIntro from "@/components/PageIntro/PageIntro";
import DayToggle from "@/components/Calendar/DayToggle";
import { moodColor, MOOD_WORDS } from "@/components/Mood/MoodFace";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { db } from "@/lib/db";
import {
  getCategories,
  getFoodDays,
  getHabits,
  getLogs,
  getMoods,
} from "@/lib/data";
import {
  addMonths,
  eachDay,
  isYmd,
  longDate,
  monthEnd,
  monthLabel,
  monthStart,
  today,
  weekday,
  WEEKDAYS_SHORT,
  WEEK_ORDER,
} from "@/lib/dates";
import {
  indexLogs,
  isActiveOn,
  isDoneOn,
  isScheduledOn,
  logKey,
} from "@/lib/habits";
import styles from "@/components/Calendar/Calendar.module.css";

export const metadata = { title: "Calendar" };

type Search = { m?: string; cat?: string; habit?: string; day?: string };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const d = today();
  const month =
    sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? `${sp.m}-01` : monthStart(d);
  const first = monthStart(month);
  const last = monthEnd(month);
  const selectedCats = (sp.cat ?? "").split(",").filter(Boolean);

  const [categories, allHabits, logs, foodDays, moods, taskDone] =
    await Promise.all([
      getCategories(),
      getHabits(),
      getLogs(first, last),
      getFoodDays(first, last),
      getMoods(first, last),
      db.taskCompletion.groupBy({
        by: ["date"],
        where: { date: { gte: first, lte: last } },
        _count: { _all: true },
      }),
    ]);

  const idx = indexLogs(logs);
  const moodBy = new Map(moods.map((m) => [m.date, m]));
  const tasksBy = new Map(taskDone.map((t) => [t.date, t._count._all]));

  // Filters: categories (any of the habit's), then optionally one habit.
  const inCats = allHabits.filter(
    (h) =>
      !selectedCats.length ||
      h.categoryIds.some((id) => selectedCats.includes(id)),
  );
  const single = sp.habit
    ? (inCats.find((h) => h.id === sp.habit) ?? null)
    : null;
  const habits = single ? [single] : inCats;

  const days = eachDay(first, last);
  const cells = days.map((day) => {
    const due = habits.filter((h) => isScheduledOn(h, day));
    // Weekly-target habits count on days they were done.
    const weeklyDone = habits.filter(
      (h) =>
        h.schedule === "WEEKLY_COUNT" &&
        isActiveOn(h, day) &&
        isDoneOn(h, day, idx, foodDays),
    );
    const doneDue = due.filter((h) => isDoneOn(h, day, idx, foodDays));
    return {
      day,
      future: day > d,
      due: due.length,
      done: doneDue.length,
      extra: weeklyDone.length,
      mood: moodBy.get(day)?.score ?? null,
      tasks: tasksBy.get(day) ?? 0,
    };
  });

  const lead = WEEK_ORDER.indexOf(weekday(first));
  const past = cells.filter((c) => !c.future && c.due > 0);
  const perfect = past.filter((c) => c.done === c.due).length;
  const checks = cells.reduce((n, c) => n + c.done + c.extra, 0);
  const moodVals = cells
    .map((c) => c.mood)
    .filter((m): m is number => m != null);
  const avgMood = moodVals.length
    ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length
    : null;

  // Links keep the other filters.
  const href = (p: Partial<Search>) => {
    const q = new URLSearchParams();
    const next = {
      m: month.slice(0, 7),
      cat: sp.cat,
      habit: sp.habit,
      day: sp.day,
      ...p,
    };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    return `/calendar?${q.toString()}`;
  };
  const toggleCat = (id: string) => {
    const set = new Set(selectedCats);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    return href({ cat: [...set].join(",") || undefined, habit: undefined });
  };

  // The day opened below the calendar.
  const openDay = sp.day && isYmd(sp.day) && sp.day <= d ? sp.day : null;
  const dayHabits = openDay
    ? inCats.filter(
        (h) =>
          isScheduledOn(h, openDay) ||
          (h.schedule === "WEEKLY_COUNT" && isActiveOn(h, openDay)),
      )
    : [];
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow='Calendar'
        heading={monthLabel(month)}
        copy='Every day you finish everything due gets crossed off. Filter by category, or pick one habit to see its chain.'
        kpis={[
          {
            label: "Perfect days",
            value: perfect,
            sub: `of ${past.length} so far`,
            accent: perfect > 0,
          },
          { label: "Check-offs", value: checks },
          {
            label: "Average mood",
            value: avgMood ? avgMood.toFixed(1) : "—",
            sub: moodVals.length
              ? `${moodVals.length} day${moodVals.length === 1 ? "" : "s"} logged`
              : undefined,
          },
        ]}
      />

      <section className='panel'>
        <div className={styles.toolbar}>
          <div className={styles.monthNav}>
            <Link
              href={href({
                m: addMonths(month, -1).slice(0, 7),
                day: undefined,
              })}
              className={styles.iconBtn}
              aria-label='Previous month'
            >
              <ChevronLeft />
            </Link>
            <span className={styles.monthLabel}>{monthLabel(month)}</span>
            <Link
              href={href({
                m: addMonths(month, 1).slice(0, 7),
                day: undefined,
              })}
              className={styles.iconBtn}
              aria-label='Next month'
            >
              <ChevronRight />
            </Link>
            {month !== monthStart(d) ? (
              <Link
                href={href({ m: undefined, day: undefined })}
                className='secondaryBtn'
              >
                This month
              </Link>
            ) : null}
          </div>

          <div className={styles.filters} aria-label='Filter by category'>
            <Link
              href={href({ cat: undefined, habit: undefined })}
              className={`${styles.chip} ${!selectedCats.length ? styles.chipOn : ""}`}
            >
              All
            </Link>
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={toggleCat(c.id)}
                className={`${styles.chip} ${selectedCats.includes(c.id) ? styles.chipOn : ""}`}
              >
                <span className={styles.chipNum}>{i + 1}</span>
                <span className='dot' style={{ backgroundColor: c.color }} />
                {c.name}
              </Link>
            ))}
          </div>

          <form className={styles.habitPick} action='/calendar'>
            <input type='hidden' name='m' value={month.slice(0, 7)} />
            {sp.cat ? <input type='hidden' name='cat' value={sp.cat} /> : null}
            <label className='field'>
              <span className='label'>One habit</span>
              <select
                name='habit'
                defaultValue={single?.id ?? ""}
                className='select'
              >
                <option value=''>
                  All habits{selectedCats.length ? " in these categories" : ""}
                </option>
                {inCats
                  .filter((h) => !h.archivedDay || h.archivedDay > first)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
              </select>
            </label>
            <button type='submit' className='secondaryBtn'>
              Show
            </button>
          </form>
        </div>

        <div className={styles.grid} role='grid' aria-label={monthLabel(month)}>
          {WEEK_ORDER.map((w) => (
            <div key={w} className={styles.dow} role='columnheader'>
              {WEEKDAYS_SHORT[w]}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div key={`lead-${i}`} className={styles.blank} />
          ))}
          {cells.map((c) => {
            const complete = !c.future && c.due > 0 && c.done === c.due;
            const partial =
              !c.future && c.due > 0 && c.done > 0 && c.done < c.due;
            const missedSingle =
              single && !c.future && c.due > 0 && c.done === 0 && c.day < d;
            const pct = c.due ? c.done / c.due : 0;
            return (
              <Link
                key={c.day}
                href={c.future ? "#" : href({ day: c.day })}
                scroll={false}
                aria-disabled={c.future}
                className={[
                  styles.cell,
                  c.future ? styles.future : "",
                  c.day === d ? styles.today : "",
                  openDay === c.day ? styles.open : "",
                  complete ? styles.complete : "",
                ].join(" ")}
                aria-label={`${longDate(c.day)}: ${c.due ? `${c.done} of ${c.due} done` : "nothing due"}${c.mood ? `, mood ${c.mood}` : ""}`}
              >
                <span className={styles.num}>{Number(c.day.slice(8))}</span>
                {complete ? (
                  <svg
                    className={styles.cross}
                    viewBox='0 0 100 100'
                    preserveAspectRatio='none'
                    aria-hidden='true'
                  >
                    <path d='M14 14 86 86M86 14 14 86' />
                  </svg>
                ) : null}
                {missedSingle ? (
                  <span className={styles.missDot} aria-hidden='true' />
                ) : null}
                {!single && (partial || (c.due && !c.future && !complete)) ? (
                  <span className={styles.frac}>
                    {c.done}/{c.due}
                  </span>
                ) : null}
                {partial ? (
                  <span className={styles.bar} aria-hidden='true'>
                    <span style={{ width: `${pct * 100}%` }} />
                  </span>
                ) : null}
                {c.extra ? (
                  <span className={styles.extra}>+{c.extra}</span>
                ) : null}
                {c.mood ? (
                  <span
                    className={styles.mood}
                    style={{ backgroundColor: moodColor(c.mood) }}
                    aria-hidden='true'
                  />
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className={styles.legend}>
          <span>
            <svg
              viewBox='0 0 100 100'
              className={styles.legendX}
              aria-hidden='true'
            >
              <path d='M14 14 86 86M86 14 14 86' />
            </svg>
            Everything due was done
          </span>
          <span>
            <span className={styles.legendFrac}>3/5</span> Done of due
          </span>
          <span>
            <span className={styles.legendExtra}>+1</span> Weekly habits done
          </span>
          <span>
            <span className={styles.legendMood} /> Mood, red to green
          </span>
        </div>
      </section>

      {openDay ? (
        <section className='panel' id='day'>
          <h2 className='cardTitle'>
            {longDate(openDay)}
            <small>
              <Link
                href={href({ day: undefined })}
                scroll={false}
                className='textLink'
              >
                Close
              </Link>
            </small>
          </h2>
          {moodBy.get(openDay) ? (
            <p className={styles.dayMood}>
              <span
                className={styles.legendMood}
                style={{
                  backgroundColor: moodColor(moodBy.get(openDay)!.score),
                }}
              />
              Mood {moodBy.get(openDay)!.score}/10 ·{" "}
              {MOOD_WORDS[moodBy.get(openDay)!.score]}
              {moodBy.get(openDay)!.note
                ? ` · “${moodBy.get(openDay)!.note}”`
                : ""}
            </p>
          ) : null}
          {tasksBy.get(openDay) ? (
            <p className='miniNote'>
              {tasksBy.get(openDay)} task{tasksBy.get(openDay) === 1 ? "" : "s"}{" "}
              finished.
            </p>
          ) : null}
          {dayHabits.length ? (
            <ul className={styles.dayList}>
              {dayHabits.map((h) => (
                <DayToggle
                  key={h.id}
                  habitId={h.id}
                  date={openDay}
                  name={h.name}
                  color={catById.get(h.categoryId)?.color ?? "#8a93a6"}
                  kind={h.kind}
                  unit={h.unit}
                  weekly={h.schedule === "WEEKLY_COUNT"}
                  done={isDoneOn(h, openDay, idx, foodDays)}
                  value={idx.get(logKey(h.id, openDay))?.value ?? null}
                />
              ))}
            </ul>
          ) : (
            <p className='empty'>Nothing was due that day.</p>
          )}
          <p className='miniNote'>
            Forgot to check something off? Fix it here; the calendar updates.
          </p>
        </section>
      ) : null}

      <p className='miniNote'>
        Tap any past day to see it and fix what you checked off.
      </p>
    </div>
  );
}
