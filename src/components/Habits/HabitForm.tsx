"use client";

// Add or edit a habit: what it is, which categories it counts toward,
// when it's due, and the day it starts.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { saveHabit, type HabitInput } from "@/actions/habits";
import type { CategoryRef } from "@/components/ui/CategoryPill";
import { WEEK_ORDER, WEEKDAYS, WEEKDAYS_SHORT } from "@/lib/dates";
import styles from "./Habits.module.css";

export type HabitFormValue = {
  id?: string;
  name: string;
  notes: string;
  kind: "CHECK" | "NUMBER" | "FOOD_LOG";
  unit: string;
  target: string;
  schedule: "DAYS" | "WEEKLY_COUNT";
  daysOfWeek: number[];
  timesPerWeek: string;
  dayNotes: Record<string, string>;
  group: string;
  meatRule: boolean;
  startDate: string;
  categoryId: string;
  extraCategoryIds: string[];
};

const PRESETS: { label: string; days: number[] }[] = [
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Mon–Fri", days: [1, 2, 3, 4, 5] },
  { label: "Mon–Thu", days: [1, 2, 3, 4] },
  { label: "Weekends", days: [0, 6] },
];

export default function HabitForm({
  initial,
  categories,
  groups,
}: {
  initial: HabitFormValue;
  categories: CategoryRef[];
  /** Existing routine names, offered as suggestions. */
  groups: string[];
}) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof HabitFormValue>(k: K, val: HabitFormValue[K]) =>
    setV((x) => ({ ...x, [k]: val }));

  const toggleDay = (d: number) =>
    set(
      "daysOfWeek",
      v.daysOfWeek.includes(d)
        ? v.daysOfWeek.filter((x) => x !== d)
        : [...v.daysOfWeek, d],
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: HabitInput = {
      id: v.id,
      name: v.name,
      notes: v.notes,
      kind: v.kind,
      unit: v.unit,
      target: v.target.trim() ? Number(v.target) : null,
      schedule: v.schedule,
      daysOfWeek: v.daysOfWeek,
      timesPerWeek: v.timesPerWeek ? Number(v.timesPerWeek) : null,
      dayNotes: v.dayNotes,
      group: v.group,
      meatRule: v.meatRule,
      startDate: v.startDate,
      categoryId: v.categoryId,
      extraCategoryIds: v.extraCategoryIds,
    };
    start(async () => {
      const res = await saveHabit(input);
      if (!res.ok) return void toast.error(res.error);
      toast.success(v.id ? "Habit saved" : "Habit added");
      router.push("/habits");
    });
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <section className='panel'>
        <h2 className='cardTitle'>The habit</h2>
        <div className={styles.grid}>
          <label className={`field ${styles.full}`}>
            <span className='label'>Name</span>
            <input
              className='input'
              value={v.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder='Bible reading'
              maxLength={80}
              required
            />
          </label>

          <fieldset className={`field ${styles.full}`}>
            <legend className='label'>How you track it</legend>
            <div className={styles.choices}>
              {(
                [
                  ["CHECK", "Check it off", "Done or not."],
                  ["NUMBER", "Log a number", "Weight, calls, pages…"],
                  [
                    "FOOD_LOG",
                    "From the food log",
                    "Done on days you log food.",
                  ],
                ] as const
              ).map(([k, title, sub]) => (
                <label
                  key={k}
                  className={`${styles.choice} ${v.kind === k ? styles.choiceOn : ""}`}
                >
                  <input
                    type='radio'
                    name='kind'
                    checked={v.kind === k}
                    onChange={() => set("kind", k)}
                    className='visuallyHidden'
                  />
                  <strong>{title}</strong>
                  <span>{sub}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {v.kind === "NUMBER" ? (
            <>
              <label className='field'>
                <span className='label'>Unit</span>
                <input
                  className='input'
                  value={v.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder='lbs, calls, pages'
                  maxLength={20}
                />
              </label>
              <label className='field'>
                <span className='label'>Daily target (optional)</span>
                <input
                  className='input'
                  inputMode='decimal'
                  value={v.target}
                  onChange={(e) => set("target", e.target.value)}
                  placeholder='25'
                />
              </label>
              <p className={`miniNote ${styles.full}`}>
                With a target, the day counts once you reach it. Without one,
                logging any number counts. Use the unit &quot;lbs&quot; for your
                weight so the app can suggest a protein goal from it.
              </p>
            </>
          ) : null}

          <label className={`field ${styles.full}`}>
            <span className='label'>Notes (optional)</span>
            <textarea
              className='textarea'
              value={v.notes}
              onChange={(e) => set("notes", e.target.value)}
              maxLength={500}
            />
          </label>
        </div>
      </section>

      <section className='panel'>
        <h2 className='cardTitle'>Categories</h2>
        <div className={styles.grid}>
          <label className='field'>
            <span className='label'>Main category (its colour)</span>
            <select
              className='select'
              value={v.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              required
            >
              <option value='' disabled>
                Pick one
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className='field'>
            <legend className='label'>Also counts toward</legend>
            <div className={styles.pills}>
              {categories
                .filter((c) => c.id !== v.categoryId)
                .map((c) => {
                  const on = v.extraCategoryIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`pill ${styles.pickPill} ${on ? styles.pickPillOn : ""}`}
                    >
                      <input
                        type='checkbox'
                        className='visuallyHidden'
                        checked={on}
                        onChange={() =>
                          set(
                            "extraCategoryIds",
                            on
                              ? v.extraCategoryIds.filter((i) => i !== c.id)
                              : [...v.extraCategoryIds, c.id],
                          )
                        }
                      />
                      <span
                        className='dot'
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </label>
                  );
                })}
            </div>
          </fieldset>
          <label className='field'>
            <span className='label'>Routine (optional)</span>
            <input
              className='input'
              list='routine-names'
              value={v.group}
              onChange={(e) => set("group", e.target.value)}
              placeholder='Morning routine'
              maxLength={40}
            />
            <datalist id='routine-names'>
              {groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </label>
          <p className='miniNote' style={{ alignSelf: "end" }}>
            Habits in the same routine show together at the top of Today.
          </p>
        </div>
      </section>

      <section className='panel'>
        <h2 className='cardTitle'>When</h2>
        <div className={styles.grid}>
          <fieldset className={`field ${styles.full}`}>
            <legend className='label'>Schedule</legend>
            <div className={styles.choices}>
              <label
                className={`${styles.choice} ${v.schedule === "DAYS" ? styles.choiceOn : ""}`}
              >
                <input
                  type='radio'
                  className='visuallyHidden'
                  checked={v.schedule === "DAYS"}
                  onChange={() => set("schedule", "DAYS")}
                />
                <strong>On set days</strong>
                <span>Every day, Mon–Fri, Tuesdays…</span>
              </label>
              <label
                className={`${styles.choice} ${v.schedule === "WEEKLY_COUNT" ? styles.choiceOn : ""}`}
              >
                <input
                  type='radio'
                  className='visuallyHidden'
                  checked={v.schedule === "WEEKLY_COUNT"}
                  onChange={() => set("schedule", "WEEKLY_COUNT")}
                />
                <strong>A number of times a week</strong>
                <span>Any days you like, Monday to Sunday.</span>
              </label>
            </div>
          </fieldset>

          {v.schedule === "DAYS" ? (
            <div className={`field ${styles.full}`}>
              <span className='label'>Days</span>
              <div className={styles.days}>
                {WEEK_ORDER.map((d) => (
                  <button
                    key={d}
                    type='button'
                    className={`${styles.day} ${v.daysOfWeek.includes(d) ? styles.dayOn : ""}`}
                    aria-pressed={v.daysOfWeek.includes(d)}
                    onClick={() => toggleDay(d)}
                  >
                    {WEEKDAYS_SHORT[d]}
                  </button>
                ))}
              </div>
              <div className={styles.presets}>
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type='button'
                    className='ghostBtn'
                    onClick={() => set("daysOfWeek", p.days)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <label className='field'>
              <span className='label'>Times a week</span>
              <select
                className='select'
                value={v.timesPerWeek || "1"}
                onChange={(e) => set("timesPerWeek", e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className='field'>
            <span className='label'>Starts on</span>
            <input
              type='date'
              className='input'
              value={v.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              required
            />
          </label>
          <p className='miniNote' style={{ alignSelf: "end" }}>
            Nothing before this day counts as missed. Use a later date to phase
            a habit in.
          </p>

          {v.schedule === "DAYS" && v.daysOfWeek.length ? (
            <details
              className={`${styles.full} ${styles.details}`}
              open={Object.values(v.dayNotes).some(Boolean)}
            >
              <summary className='label'>
                A focus for each day (optional)
              </summary>
              <p className='miniNote'>
                Shown on Today, e.g. which room to clean. Leave empty for none.
              </p>
              <div className={styles.dayNotes}>
                {WEEK_ORDER.filter((d) => v.daysOfWeek.includes(d)).map((d) => (
                  <label key={d} className='field'>
                    <span className='label'>{WEEKDAYS[d]}</span>
                    <input
                      className='input'
                      value={v.dayNotes[String(d)] ?? ""}
                      onChange={(e) =>
                        set("dayNotes", {
                          ...v.dayNotes,
                          [String(d)]: e.target.value,
                        })
                      }
                      maxLength={60}
                    />
                  </label>
                ))}
              </div>
            </details>
          ) : null}

          <label className={`${styles.full} ${styles.toggle}`}>
            <input
              type='checkbox'
              checked={v.meatRule}
              onChange={(e) => set("meatRule", e.target.checked)}
            />
            <span>
              <strong>Follows the meat rotation</strong>
              <span className='miniNote'>
                For a meatless habit: one planned meat meal a week (red meat,
                fish, chicken), and the last week of the month fully meatless.
                The planned meal still counts as a success.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className={styles.actions}>
        <button type='submit' className='primaryBtn' disabled={pending}>
          {pending ? "Saving…" : v.id ? "Save habit" : "Add habit"}
        </button>
        <button
          type='button'
          className='secondaryBtn'
          onClick={() => router.push("/habits")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
