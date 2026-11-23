export type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  addedSugar: number;
  fiber: number;
};

export const ZERO: Totals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sugar: 0,
  addedSugar: 0,
  fiber: 0,
};

export function sumTotals(rows: Partial<Totals>[]): Totals {
  const t = { ...ZERO };
  for (const r of rows)
    for (const k of Object.keys(t) as (keyof Totals)[]) t[k] += r[k] ?? 0;
  return t;
}

/** Fiber: about 14 g per 1,000 calories (Dietary Guidelines). */
export function fiberGoal(calories: number) {
  return Math.round((calories / 1000) * 14);
}

/** Added sugar: under 10% of calories (Dietary Guidelines). 4 kcal a gram. */
export function addedSugarLimit(calories: number) {
  return Math.round((calories * 0.1) / 4);
}

export const MEALS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
export type MealKey = (typeof MEALS)[number];
export const MEAL_LABELS: Record<MealKey, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snacks",
};

/** "12.5" → "12.5", "12.0" → "12" */
export function num(n: number, digits = 1) {
  return Number(n.toFixed(digits)).toLocaleString();
}
