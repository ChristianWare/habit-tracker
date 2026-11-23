import Link from "next/link";
import PageIntro from "@/components/PageIntro/PageIntro";
import HabitRow from "@/components/Today/HabitRow";
import TaskRow from "@/components/Tasks/TaskRow";
import QuickAdd from "@/components/Tasks/QuickAdd";
import MoodCheck from "@/components/Mood/MoodCheck";
import Meter from "@/components/ui/Meter";
import type { TodayBlock, TodayHabit } from "@/components/Today/types";
import type { TaskItem } from "@/components/Tasks/types";
import { db } from "@/lib/db";
import {
  getCategories,
  getFoodDays,
  getGoals,
  getHabits,
  getLogs,
} from "@/lib/data";
import { addDays, dayLabel, daysBetween, today } from "@/lib/dates";
import {
  dayNote,
  indexLogs,
  isActiveOn,
  isDoneOn,
  logKey,
  meatWeek,
  plannedMealUsed,
  showsOn,
  streakFor,
  weeklyProgress,
} from "@/lib/habits";
import { sumTotals } from "@/lib/nutrition";
import styles from "@/components/Today/Today.module.css";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const d = today();
  const from = addDays(d, -400);

  const [
    categories,
    habits,
    logs,
    foodDays,
    goals,
    tasks,
    inboxCount,
    mood,
    entries,
  ] = await Promise.all([
    getCategories(),
    getHabits({ activeOnly: true }),
    getLogs(from, d),
    getFoodDays(from, d),
    getGoals(),
    db.task.findMany({
      where: { completedAt: null, dueDate: { lte: d } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      include: { category: true, categories: true },
    }),
    db.task.count({ where: { completedAt: null, dueDate: null } }),
    db.moodLog.findUnique({ where: { date: d } }),
    db.foodEntry.findMany({ where: { date: d } }),
  ]);

  const catById = new Map(categories.map((c) => [c.id, c]));
  const logIdx = indexLogs(logs);

  // ── Habits for today ──
  const todays = habits.filter((h) => showsOn(h, d));
  const toItem = (h: (typeof habits)[number]): TodayHabit => {
    const log = logIdx.get(logKey(h.id, d));
    const meat =
      h.meatRule && goals.meatRotation
        ? (() => {
            const w = meatWeek(d);
            const usedOn = plannedMealUsed(h, d, logIdx);
            return {
              label: w.label,
              meal: w.meal,
              usedOn: usedOn && usedOn !== d ? usedOn : null,
              plannedToday: usedOn === d,
            };
          })()
        : null;
    return {
      id: h.id,
      name: h.name,
      notes: h.notes,
      kind: h.kind,
      unit: h.unit,
      target: h.target,
      categories: h.categoryIds
        .map((id) => catById.get(id))
        .filter((c): c is NonNullable<typeof c> => !!c),
      dayNote: dayNote(h, d),
      done: isDoneOn(h, d, logIdx, foodDays),
      value: log?.value ?? null,
      weekly:
        h.schedule === "WEEKLY_COUNT"
          ? weeklyProgress(h, d, logIdx, foodDays)
          : null,
      streak: streakFor(h, d, logIdx, foodDays),
      meat,
    };
  };

  // Weekly targets already met (and not done today) drop out of the list.
  const visible = todays.filter((h) => {
    if (h.schedule !== "WEEKLY_COUNT") return true;
    const w = weeklyProgress(h, d, logIdx, foodDays);
    return w.done < w.target || isDoneOn(h, d, logIdx, foodDays);
  });

  // Routines first (Morning routine), then each category in order.
  const blocks: TodayBlock[] = [];
  const grouped = new Map<string, TodayHabit[]>();
  for (const h of visible) {
    if (!h.group) continue;
    if (!grouped.has(h.group)) grouped.set(h.group, []);
    grouped.get(h.group)!.push(toItem(h));
  }
  for (const [g, list] of grouped)
    blocks.push({ key: `g-${g}`, title: g, color: null, habits: list });
  for (const c of categories) {
    const list = visible
      .filter((h) => !h.group && h.categoryId === c.id)
      .map(toItem);
    if (list.length)
      blocks.push({ key: c.id, title: c.name, color: c.color, habits: list });
  }

  const dueToday = visible.filter((h) => h.schedule === "DAYS");
  const doneToday = dueToday.filter((h) => isDoneOn(h, d, logIdx, foodDays));

  // Habits that start soon (the phase-in).
  const upcoming = habits
    .filter((h) => !h.archivedDay && h.startDate > d && !isActiveOn(h, d))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // ── Tasks ──
  const taskItems: TaskItem[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    notes: t.notes,
    dueDate: t.dueDate,
    repeat: t.repeat,
    completed: false,
    categories: [t.category, ...t.categories].filter(
      (c): c is NonNullable<typeof c> => !!c,
    ),
    categoryId: t.categoryId,
    extraCategoryIds: t.categories.map((c) => c.id),
  }));
  const overdue = taskItems.filter((t) => t.dueDate! < d).length;

  const totals = sumTotals(entries);
  const allDone = dueToday.length > 0 && doneToday.length === dueToday.length;

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow={dayLabel(d)}
        heading='Today'
        copy={
          dueToday.length
            ? "Here's what to focus on today, and which part of your life each one belongs to."
            : "Nothing is due today. Add habits on the Habits page."
        }
        kpis={[
          {
            label: "Habits done",
            value: `${doneToday.length}/${dueToday.length}`,
            accent: allDone,
            sub: allDone ? "Every one. Well done." : undefined,
          },
          {
            label: "Tasks due",
            value: taskItems.length,
            sub: overdue ? `${overdue} overdue` : undefined,
            href: "/tasks",
            accent: overdue > 0,
          },
          {
            label: "Calories",
            value: Math.round(totals.calories).toLocaleString(),
            sub: `of ${goals.calories.toLocaleString()}`,
            href: "/food",
          },
          {
            label: "Mood",
            value: mood ? `${mood.score}/10` : "—",
            sub: mood ? undefined : "Check in tonight",
          },
        ]}
      />

      <div className={styles.columns}>
        <div className={styles.stack}>
          {allDone ? (
            <div className={styles.allDone}>
              <strong>All done</strong>
              Every habit due today is checked off.
            </div>
          ) : null}

          {blocks.map((b) => (
            <section key={b.key} className='panel'>
              <h2 className={`cardTitle ${styles.blockTitle}`}>
                {b.color ? (
                  <span
                    className={styles.swatch}
                    style={{ backgroundColor: b.color }}
                  />
                ) : null}
                {b.title}
                <span className={styles.count}>
                  {b.habits.filter((h) => h.done).length}/{b.habits.length}
                </span>
              </h2>
              <ul className={styles.list}>
                {b.habits.map((h) => (
                  <HabitRow key={h.id} h={h} date={d} />
                ))}
              </ul>
            </section>
          ))}

          {!blocks.length ? (
            <p className='empty'>
              No habits yet.{" "}
              <Link href='/habits/new' className='textLink'>
                Add your first one
              </Link>
              .
            </p>
          ) : null}
        </div>

        <div className={styles.stack}>
          <section className='panel'>
            <h2 className='cardTitle'>
              Tasks
              <small>
                <Link href='/tasks' className='textLink'>
                  All tasks{inboxCount ? ` · ${inboxCount} in inbox` : ""}
                </Link>
              </small>
            </h2>
            <QuickAdd
              categories={categories}
              defaultDate={d}
              placeholder='Add something for today…'
              compact
            />
            {taskItems.length ? (
              <ul className={styles.list}>
                {taskItems.map((t) => (
                  <TaskRow key={t.id} t={t} today={d} />
                ))}
              </ul>
            ) : (
              <p className='empty'>
                Nothing due. Clear the date to send a task to your inbox.
              </p>
            )}
          </section>

          <section className='panel'>
            <h2 className='cardTitle'>
              Food
              <small>
                <Link href='/food' className='textLink'>
                  Log food
                </Link>
              </small>
            </h2>
            <Meter
              label='Calories'
              value={totals.calories}
              goal={goals.calories}
              gold
            />
            <Meter
              label='Protein'
              value={totals.protein}
              goal={goals.protein}
              unit=' g'
            />
            {goals.weight ? (
              <p className='miniNote'>
                Latest weight: {goals.weight.value} lbs (
                {dayLabel(goals.weight.date)})
              </p>
            ) : null}
          </section>

          {upcoming.length ? (
            <section className='panel panelIvory'>
              <h2 className='cardTitle'>Starting soon</h2>
              <ul className={styles.soon}>
                {upcoming.map((h) => {
                  const n = daysBetween(d, h.startDate);
                  return (
                    <li key={h.id}>
                      <span>{h.name}</span>
                      <span>
                        {dayLabel(h.startDate)} · in {n} day{n === 1 ? "" : "s"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {/* Always the last thing on the page. */}
      <MoodCheck
        date={d}
        initialScore={mood?.score ?? null}
        initialNote={mood?.note ?? null}
      />
    </div>
  );
}
