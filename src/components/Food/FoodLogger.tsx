"use client";

// Adding food to a day: pick a saved food, type in a new one from its
// label (saved for next time), or log a whole saved meal with one tap.

import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { logFood, logNewFood, logSavedMeal } from "@/actions/food";
import { MEAL_LABELS, MEALS, num, type MealKey } from "@/lib/nutrition";
import type { FoodRow, SavedMealRow } from "./types";
import styles from "./Food.module.css";

type Tab = "saved" | "new" | "meals";

/** Breakfast before 11, lunch before 4, dinner before 9, then snacks. */
function guessMeal(): MealKey {
  const h = new Date().getHours();
  if (h < 11) return "BREAKFAST";
  if (h < 16) return "LUNCH";
  if (h < 21) return "DINNER";
  return "SNACK";
}

const MACRO_FIELDS = [
  ["calories", "Calories", ""],
  ["protein", "Protein", "g"],
  ["carbs", "Carbs", "g"],
  ["fat", "Fat", "g"],
  ["sugar", "Sugar", "g"],
  ["addedSugar", "Added sugar", "g"],
  ["fiber", "Fiber", "g"],
] as const;

type MacroKey = (typeof MACRO_FIELDS)[number][0];

export default function FoodLogger({
  date,
  foods,
  meals,
}: {
  date: string;
  foods: FoodRow[];
  meals: SavedMealRow[];
}) {
  const [tab, setTab] = useState<Tab>("saved");
  const [meal, setMeal] = useState<MealKey>(guessMeal);
  const [query, setQuery] = useState("");
  const [servings, setServings] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const blank = {
    name: "",
    serving: "1 serving",
    servings: "1",
    save: true,
  } as {
    name: string;
    serving: string;
    servings: string;
    save: boolean;
  } & Partial<Record<MacroKey, string>>;
  const [draft, setDraft] = useState(blank);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods;
  }, [foods, query]);

  const addSaved = (f: FoodRow) => {
    const s = Number(servings[f.id] ?? "1");
    if (!(s > 0)) return void toast.error("Servings must be more than 0.");
    start(async () => {
      const res = await logFood({ date, meal, foodId: f.id, servings: s });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${f.name} added to ${MEAL_LABELS[meal].toLowerCase()}`);
    });
  };

  const addNew = (e: React.FormEvent) => {
    e.preventDefault();
    const n = (k: MacroKey) => Number(draft[k] || 0);
    if (!draft.name.trim()) return void toast.error("Name the food.");
    if (!draft.calories) return void toast.error("Enter the calories.");
    start(async () => {
      const res = await logNewFood({
        date,
        meal,
        name: draft.name,
        serving: draft.serving,
        servings: Number(draft.servings || 1),
        save: draft.save,
        calories: n("calories"),
        protein: n("protein"),
        carbs: n("carbs"),
        fat: n("fat"),
        sugar: n("sugar"),
        addedSugar: n("addedSugar"),
        fiber: n("fiber"),
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(draft.save ? "Logged and saved to your foods" : "Logged");
      setDraft(blank);
    });
  };

  const addMeal = (m: SavedMealRow) =>
    start(async () => {
      const res = await logSavedMeal(m.id, date);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${m.name} logged`);
    });

  return (
    <section className='panel'>
      <h2 className='cardTitle'>Add food</h2>

      <div className={styles.topRow}>
        <div className={styles.tabs} role='tablist'>
          {(
            [
              ["saved", "My foods"],
              ["new", "New food"],
              ["meals", "Meals"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type='button'
              role='tab'
              aria-selected={tab === k}
              className={`${styles.tab} ${tab === k ? styles.tabOn : ""}`}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== "meals" ? (
          <label className={styles.mealPick}>
            <span className='label'>To</span>
            <select
              className='select'
              value={meal}
              onChange={(e) => setMeal(e.target.value as MealKey)}
            >
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {tab === "saved" ? (
        <>
          <input
            className='input'
            type='search'
            placeholder='Search your foods…'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label='Search your foods'
          />
          {shown.length ? (
            <ul className={styles.foodList}>
              {shown.map((f) => (
                <li key={f.id} className={styles.foodItem}>
                  <div className={styles.foodText}>
                    <strong>{f.name}</strong>
                    <span>
                      {f.serving} · {num(f.calories, 0)} cal · {num(f.protein)}{" "}
                      g protein
                    </span>
                  </div>
                  <input
                    className={`input ${styles.servings}`}
                    inputMode='decimal'
                    value={servings[f.id] ?? "1"}
                    onChange={(e) =>
                      setServings((s) => ({ ...s, [f.id]: e.target.value }))
                    }
                    aria-label={`Servings of ${f.name}`}
                  />
                  <button
                    type='button'
                    className='primaryBtn'
                    disabled={pending}
                    onClick={() => addSaved(f)}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className='empty'>
              {foods.length ? "No match." : "No saved foods yet."}{" "}
              <button
                type='button'
                className='textLink'
                onClick={() => setTab("new")}
              >
                Add a new food
              </button>
            </p>
          )}
        </>
      ) : null}

      {tab === "new" ? (
        <form className={styles.newForm} onSubmit={addNew}>
          <label className={`field ${styles.span2}`}>
            <span className='label'>Food</span>
            <input
              className='input'
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder='Black bean burrito'
              maxLength={80}
            />
          </label>
          <label className='field'>
            <span className='label'>Serving size</span>
            <input
              className='input'
              value={draft.serving}
              onChange={(e) => setDraft({ ...draft, serving: e.target.value })}
              maxLength={40}
            />
          </label>
          <label className='field'>
            <span className='label'>Servings eaten</span>
            <input
              className='input'
              inputMode='decimal'
              value={draft.servings}
              onChange={(e) => setDraft({ ...draft, servings: e.target.value })}
            />
          </label>
          {MACRO_FIELDS.map(([k, label, unit]) => (
            <label key={k} className='field'>
              <span className='label'>
                {label}
                {unit ? ` (${unit})` : ""}
              </span>
              <input
                className='input'
                inputMode='decimal'
                value={draft[k] ?? ""}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                placeholder='0'
              />
            </label>
          ))}
          <label className={`${styles.span2} ${styles.saveToggle}`}>
            <input
              type='checkbox'
              checked={draft.save}
              onChange={(e) => setDraft({ ...draft, save: e.target.checked })}
            />
            Save to my foods for next time
          </label>
          <p className={`miniNote ${styles.span2}`}>
            Enter the numbers for one serving, as on the label.
          </p>
          <div className={styles.span2}>
            <button type='submit' className='primaryBtn' disabled={pending}>
              {pending ? "Adding…" : "Log it"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "meals" ? (
        meals.length ? (
          <ul className={styles.foodList}>
            {meals.map((m) => (
              <li key={m.id} className={styles.foodItem}>
                <div className={styles.foodText}>
                  <strong>{m.name}</strong>
                  <span>
                    {MEAL_LABELS[m.meal]} · {num(m.calories, 0)} cal ·{" "}
                    {num(m.protein)} g protein · {m.items.join(", ")}
                  </span>
                </div>
                <button
                  type='button'
                  className='primaryBtn'
                  disabled={pending}
                  onClick={() => addMeal(m)}
                >
                  Log
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='empty'>
            No saved meals yet. Log the foods once, then use &quot;Save as a
            meal&quot; under that meal.
          </p>
        )
      ) : null}
    </section>
  );
}
