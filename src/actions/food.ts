"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { isYmd } from "@/lib/dates";
import { guard, refresh, fail, type Result } from "./_shared";

const n = z.number().finite().min(0).max(10000);
const MealEnum = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);
const Ymd = z.string().refine(isYmd, "Bad date.");

const Macros = z.object({
  calories: n,
  protein: n.default(0),
  carbs: n.default(0),
  fat: n.default(0),
  sugar: n.default(0),
  addedSugar: n.default(0),
  fiber: n.default(0),
});

const FoodInput = Macros.extend({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name the food.").max(80),
  serving: z.string().trim().max(40).default("1 serving"),
});

export type FoodInput = z.input<typeof FoodInput>;

/** Add or edit a saved food. */
export async function saveFood(
  input: FoodInput,
): Promise<Result & { id?: string }> {
  try {
    await guard();
    const { id, ...f } = FoodInput.parse(input);
    const row = id
      ? await db.food.update({ where: { id }, data: f })
      : await db.food.create({ data: f });
    refresh();
    return { ok: true, id: row.id };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFood(id: string): Promise<Result> {
  try {
    await guard();
    await db.food.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const LogSaved = z.object({
  date: Ymd,
  meal: MealEnum,
  foodId: z.string().min(1),
  servings: z.number().positive().max(50),
});

/** Log a saved food: its numbers times the servings. */
export async function logFood(
  input: z.input<typeof LogSaved>,
): Promise<Result> {
  try {
    await guard();
    const { date, meal, foodId, servings } = LogSaved.parse(input);
    const f = await db.food.findUniqueOrThrow({ where: { id: foodId } });
    await db.foodEntry.create({
      data: {
        date,
        meal,
        foodId,
        servings,
        name: f.name,
        calories: f.calories * servings,
        protein: f.protein * servings,
        carbs: f.carbs * servings,
        fat: f.fat * servings,
        sugar: f.sugar * servings,
        addedSugar: f.addedSugar * servings,
        fiber: f.fiber * servings,
      },
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const LogNew = FoodInput.extend({
  date: Ymd,
  meal: MealEnum,
  servings: z.number().positive().max(50).default(1),
  save: z.boolean().default(true),
});

/** Log something new, typed in from its label; save it for next time. */
export async function logNewFood(
  input: z.input<typeof LogNew>,
): Promise<Result> {
  try {
    await guard();
    const { date, meal, servings, save, id: _id, ...f } = LogNew.parse(input);
    void _id;
    let foodId: string | null = null;
    if (save) foodId = (await db.food.create({ data: f })).id;
    await db.foodEntry.create({
      data: {
        date,
        meal,
        foodId,
        servings,
        name: f.name,
        calories: f.calories * servings,
        protein: f.protein * servings,
        carbs: f.carbs * servings,
        fat: f.fat * servings,
        sugar: f.sugar * servings,
        addedSugar: f.addedSugar * servings,
        fiber: f.fiber * servings,
      },
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEntry(id: string): Promise<Result> {
  try {
    await guard();
    await db.foodEntry.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Log every food in a saved meal at once. */
export async function logSavedMeal(
  mealId: string,
  date: string,
): Promise<Result> {
  try {
    await guard();
    if (!isYmd(date)) throw new Error("Bad date.");
    const m = await db.savedMeal.findUniqueOrThrow({
      where: { id: mealId },
      include: { items: { include: { food: true } } },
    });
    await db.foodEntry.createMany({
      data: m.items.map(({ food: f, servings }) => ({
        date,
        meal: m.meal,
        foodId: f.id,
        servings,
        name: f.name,
        calories: f.calories * servings,
        protein: f.protein * servings,
        carbs: f.carbs * servings,
        fat: f.fat * servings,
        sugar: f.sugar * servings,
        addedSugar: f.addedSugar * servings,
        fiber: f.fiber * servings,
      })),
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Save one meal of a day (its saved foods) as a one-tap meal. */
export async function saveMealFromDay(input: {
  date: string;
  meal: z.infer<typeof MealEnum>;
  name: string;
}): Promise<Result> {
  try {
    await guard();
    const { date, meal, name } = z
      .object({
        date: Ymd,
        meal: MealEnum,
        name: z.string().trim().min(1, "Name the meal.").max(60),
      })
      .parse(input);
    const entries = await db.foodEntry.findMany({
      where: { date, meal, foodId: { not: null } },
    });
    if (!entries.length)
      throw new Error("Only saved foods can go in a meal. Log some first.");
    await db.savedMeal.create({
      data: {
        name,
        meal,
        items: {
          create: entries.map((e) => ({
            foodId: e.foodId!,
            servings: e.servings,
          })),
        },
      },
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSavedMeal(id: string): Promise<Result> {
  try {
    await guard();
    await db.savedMeal.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
