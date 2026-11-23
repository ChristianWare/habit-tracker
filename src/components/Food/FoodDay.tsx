"use client";

// What you ate on the day, by meal, with a delete on each line and
// "Save as a meal" to log the same set again with one tap.

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteEntry, saveMealFromDay } from "@/actions/food";
import { TrashIcon } from "@/components/icons";
import { MEAL_LABELS, MEALS, num, type MealKey } from "@/lib/nutrition";
import type { EntryRow } from "./types";
import styles from "./Food.module.css";

export default function FoodDay({
  date,
  entries,
}: {
  date: string;
  entries: EntryRow[];
}) {
  const [pending, start] = useTransition();
  const [naming, setNaming] = useState<MealKey | null>(null);
  const [name, setName] = useState("");

  const remove = (id: string) =>
    start(async () => {
      const res = await deleteEntry(id);
      if (!res.ok) toast.error(res.error);
    });

  const saveMeal = (meal: MealKey) =>
    start(async () => {
      const res = await saveMealFromDay({ date, meal, name });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Saved "${name}". Find it under Meals.`);
      setNaming(null);
      setName("");
    });

  if (!entries.length)
    return (
      <section className='panel'>
        <h2 className='cardTitle'>Eaten</h2>
        <p className='empty'>Nothing logged yet for this day.</p>
      </section>
    );

  return (
    <section className='panel'>
      <h2 className='cardTitle'>Eaten</h2>
      {MEALS.map((m) => {
        const list = entries.filter((e) => e.meal === m);
        if (!list.length) return null;
        const cals = list.reduce((n, e) => n + e.calories, 0);
        const canSave = list.some((e) => e.fromSaved);
        return (
          <div key={m} className={styles.mealBlock}>
            <div className={styles.mealHead}>
              <span className='label'>{MEAL_LABELS[m]}</span>
              <span className={styles.mealCals}>{num(cals, 0)} cal</span>
            </div>
            <ul className={styles.entries}>
              {list.map((e) => (
                <li key={e.id} className={styles.entry}>
                  <span className={styles.entryName}>
                    {e.name}
                    {e.servings !== 1 ? (
                      <span className={styles.entryX}>
                        {" "}
                        × {num(e.servings, 2)}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.entryNums}>
                    {num(e.calories, 0)} cal · P {num(e.protein, 0)} · C{" "}
                    {num(e.carbs, 0)} · F {num(e.fat, 0)}
                  </span>
                  <button
                    type='button'
                    className='ghostBtn'
                    onClick={() => remove(e.id)}
                    disabled={pending}
                    aria-label={`Remove ${e.name}`}
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
            {canSave ? (
              naming === m ? (
                <form
                  className={styles.nameMeal}
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    saveMeal(m);
                  }}
                >
                  <input
                    className='input'
                    autoFocus
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    placeholder='Name it, e.g. Sea moss shake'
                    maxLength={60}
                  />
                  <button
                    type='submit'
                    className='primaryBtn'
                    disabled={pending || !name.trim()}
                  >
                    Save
                  </button>
                  <button
                    type='button'
                    className='secondaryBtn'
                    onClick={() => setNaming(null)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type='button'
                  className={`ghostBtn ${styles.saveMealBtn}`}
                  onClick={() => setNaming(m)}
                >
                  Save {MEAL_LABELS[m].toLowerCase()} as a meal
                </button>
              )
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
