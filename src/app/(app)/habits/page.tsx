import Link from "next/link";
import PageIntro from "@/components/PageIntro/PageIntro";
import HabitActions from "@/components/Habits/HabitActions";
import CategoryPill from "@/components/ui/CategoryPill";
import { PlusIcon } from "@/components/icons";
import { getCategories, getFoodDays, getHabits, getLogs } from "@/lib/data";
import { addDays, dayLabel, today } from "@/lib/dates";
import {
  indexLogs,
  rateFor,
  scheduleLabel,
  streakFor,
  type HabitLite,
} from "@/lib/habits";
import styles from "@/components/Habits/Habits.module.css";

export const metadata = { title: "Habits" };

const KIND: Record<HabitLite["kind"], string> = {
  CHECK: "Check off",
  NUMBER: "Number",
  FOOD_LOG: "Food log",
};

export default async function HabitsPage() {
  const d = today();
  const from = addDays(d, -400);
  const [categories, habits, logs, foodDays] = await Promise.all([
    getCategories(),
    getHabits(),
    getLogs(from, d),
    getFoodDays(from, d),
  ]);
  const idx = indexLogs(logs);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const active = habits.filter((h) => !h.archivedDay);
  const archived = habits.filter((h) => h.archivedDay);

  const stats = (h: HabitLite) => {
    const r = rateFor(h, addDays(d, -29), d, d, idx, foodDays);
    return {
      rate: r.expected ? Math.round((r.done / r.expected) * 100) : null,
      streak: streakFor(h, d, idx, foodDays),
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      <PageIntro
        eyebrow='Habits'
        heading='Your habits'
        copy='Add, edit, reorder or retire them. Archiving hides a habit from today on but keeps its history on your calendar.'
        actions={
          <Link href='/habits/new' className='primaryBtn'>
            <PlusIcon width={16} height={16} /> Add a habit
          </Link>
        }
        kpis={[
          { label: "Active habits", value: active.length },
          { label: "Categories", value: categories.length, href: "/settings" },
        ]}
      />

      {categories.map((c) => {
        const list = active.filter((h) => h.categoryId === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className='panel'>
            <h2 className='cardTitle'>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <span
                  className='dot'
                  style={{
                    backgroundColor: c.color,
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                  }}
                />
                {c.name}
              </span>
              <small>{list.length}</small>
            </h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Habit</th>
                  <th>When</th>
                  <th className={styles.num}>Last 30 days</th>
                  <th className={styles.num}>Streak</th>
                  <th className={styles.num}>
                    <span className='visuallyHidden'>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((h) => {
                  const s = stats(h);
                  const extra = h.categoryIds
                    .slice(1)
                    .map((id) => catById.get(id))
                    .filter(Boolean);
                  return (
                    <tr key={h.id}>
                      <td>
                        <span className={styles.habitName}>{h.name}</span>
                        <span className={styles.sub}>
                          {KIND[h.kind]}
                          {h.kind === "NUMBER" && h.target
                            ? ` · target ${h.target} ${h.unit ?? ""}`
                            : ""}
                          {h.group ? ` · ${h.group}` : ""}
                          {h.meatRule ? " · meat rotation" : ""}
                          {h.startDate > d
                            ? ` · starts ${dayLabel(h.startDate)}`
                            : ""}
                        </span>
                        {extra.length ? (
                          <span
                            style={{
                              display: "flex",
                              gap: "0.6rem",
                              marginTop: "0.6rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {extra.map((x) => (
                              <CategoryPill key={x!.id} c={x!} />
                            ))}
                          </span>
                        ) : null}
                      </td>
                      <td>{scheduleLabel(h)}</td>
                      <td className={`${styles.num} ${styles.hideSm}`}>
                        {s.rate == null ? "—" : `${s.rate}%`}
                      </td>
                      <td className={`${styles.num} ${styles.hideSm}`}>
                        {s.streak.count
                          ? `${s.streak.count} ${s.streak.unit}${s.streak.count === 1 ? "" : "s"}`
                          : "—"}
                      </td>
                      <td>
                        <HabitActions
                          id={h.id}
                          name={h.name}
                          archived={false}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      {!active.length ? (
        <p className='empty'>
          No habits yet.{" "}
          <Link href='/habits/new' className='textLink'>
            Add your first one
          </Link>
          .
        </p>
      ) : null}

      {archived.length ? (
        <section className='panel panelIvory'>
          <h2 className='cardTitle'>
            Archived <small>{archived.length}</small>
          </h2>
          <table className={styles.table}>
            <tbody>
              {archived.map((h) => (
                <tr key={h.id}>
                  <td>
                    <span className={styles.habitName}>{h.name}</span>
                    <span className={styles.sub}>
                      {catById.get(h.categoryId)?.name} · archived{" "}
                      {dayLabel(h.archivedDay!)}
                    </span>
                  </td>
                  <td>
                    <HabitActions id={h.id} name={h.name} archived />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
