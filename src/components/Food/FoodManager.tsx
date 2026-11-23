"use client";

// Your saved foods and meals: fix a food's numbers or remove what you no
// longer eat. Changes never touch days already logged.

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteFood, deleteSavedMeal, saveFood } from "@/actions/food";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { MEAL_LABELS, num } from "@/lib/nutrition";
import type { FoodRow, SavedMealRow } from "./types";
import styles from "./Food.module.css";

const FIELDS = [
  ["calories", "Cal"],
  ["protein", "Protein g"],
  ["carbs", "Carbs g"],
  ["fat", "Fat g"],
  ["sugar", "Sugar g"],
  ["addedSugar", "Added g"],
  ["fiber", "Fiber g"],
] as const;

export default function FoodManager({
  foods,
  meals,
}: {
  foods: FoodRow[];
  meals: SavedMealRow[];
}) {
  const [editing, setEditing] = useState<FoodRow | null>(null);
  const [pending, start] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    start(async () => {
      const res = await saveFood(editing);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Food saved");
      setEditing(null);
    });
  };

  return (
    <details className={`panel ${styles.manage}`}>
      <summary className='cardTitle'>
        My foods and meals
        <small>
          {foods.length} foods · {meals.length} meals
        </small>
      </summary>

      {meals.length ? (
        <div className={styles.mealBlock}>
          <span className='label'>Meals</span>
          <ul className={styles.entries}>
            {meals.map((m) => (
              <li key={m.id} className={styles.entry}>
                <span className={styles.entryName}>{m.name}</span>
                <span className={styles.entryNums}>
                  {MEAL_LABELS[m.meal]} · {num(m.calories, 0)} cal ·{" "}
                  {m.items.length} foods
                </span>
                <button
                  type='button'
                  className='ghostBtn'
                  disabled={pending}
                  aria-label={`Delete ${m.name}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete the meal "${m.name}"? Logged days stay as they are.`,
                      )
                    )
                      start(async () => {
                        const res = await deleteSavedMeal(m.id);
                        if (!res.ok) toast.error(res.error);
                      });
                  }}
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.mealBlock}>
        <span className='label'>Foods (per serving)</span>
        <ul className={styles.entries}>
          {foods.map((f) =>
            editing?.id === f.id ? (
              <li key={f.id}>
                <form className={styles.editFood} onSubmit={save}>
                  <label className='field'>
                    <span className='label'>Name</span>
                    <input
                      className='input'
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                    />
                  </label>
                  <label className='field'>
                    <span className='label'>Serving</span>
                    <input
                      className='input'
                      value={editing.serving}
                      onChange={(e) =>
                        setEditing({ ...editing, serving: e.target.value })
                      }
                    />
                  </label>
                  {FIELDS.map(([k, label]) => (
                    <label key={k} className='field'>
                      <span className='label'>{label}</span>
                      <input
                        className='input'
                        inputMode='decimal'
                        value={String(editing[k])}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            [k]: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                  ))}
                  <div className={styles.editActions}>
                    <button
                      type='submit'
                      className='primaryBtn'
                      disabled={pending}
                    >
                      Save
                    </button>
                    <button
                      type='button'
                      className='secondaryBtn'
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={f.id} className={styles.entry}>
                <span className={styles.entryName}>
                  {f.name} <span className={styles.entryX}>· {f.serving}</span>
                </span>
                <span className={styles.entryNums}>
                  {num(f.calories, 0)} cal · P {num(f.protein)} · C{" "}
                  {num(f.carbs)} · F {num(f.fat)} · Fiber {num(f.fiber)}
                </span>
                <span className={styles.entryBtns}>
                  <button
                    type='button'
                    className='ghostBtn'
                    onClick={() => setEditing(f)}
                    aria-label={`Edit ${f.name}`}
                  >
                    <PencilIcon width={16} height={16} />
                  </button>
                  <button
                    type='button'
                    className='ghostBtn'
                    disabled={pending}
                    aria-label={`Delete ${f.name}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${f.name}" from your foods? It's also removed from saved meals.`,
                        )
                      )
                        start(async () => {
                          const res = await deleteFood(f.id);
                          if (!res.ok) toast.error(res.error);
                        });
                    }}
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
      <p className='miniNote'>
        The starter foods use rounded USDA numbers. Brands differ, so check your
        labels and fix any that are off.
      </p>
    </details>
  );
}
