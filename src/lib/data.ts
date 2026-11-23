import "server-only";
import { db } from "./db";
import { ymdInZone, type Ymd } from "./dates";
import type { HabitLite, LogLite } from "./habits";

export type CategoryLite = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

export async function getCategories(): Promise<CategoryLite[]> {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, color: true, sortOrder: true },
  });
}

export async function getSettings() {
  const s = await db.settings.findUnique({ where: { id: "app" } });
  return (
    s ?? {
      id: "app",
      calorieGoal: 3000,
      proteinGoal: null,
      proteinPerLb: 0.8,
      meatRotation: true,
      updatedAt: new Date(),
    }
  );
}

/** Every habit, archived ones included (their past still counts). */
export async function getHabits(opts?: {
  activeOnly?: boolean;
}): Promise<HabitLite[]> {
  const rows = await db.habit.findMany({
    where: opts?.activeOnly ? { archivedAt: null } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { categories: { select: { id: true } } },
  });
  return rows.map((h) => ({
    id: h.id,
    name: h.name,
    notes: h.notes,
    kind: h.kind,
    unit: h.unit,
    target: h.target,
    schedule: h.schedule,
    daysOfWeek: h.daysOfWeek,
    timesPerWeek: h.timesPerWeek,
    dayNotes: (h.dayNotes as Record<string, string> | null) ?? null,
    group: h.group,
    meatRule: h.meatRule,
    startDate: h.startDate,
    archivedDay: h.archivedAt ? ymdInZone(h.archivedAt) : null,
    categoryId: h.categoryId,
    categoryIds: [h.categoryId, ...h.categories.map((c) => c.id)],
    sortOrder: h.sortOrder,
  }));
}

export async function getLogs(from: Ymd, to: Ymd): Promise<LogLite[]> {
  return db.habitLog.findMany({
    where: { date: { gte: from, lte: to } },
    select: {
      habitId: true,
      date: true,
      done: true,
      value: true,
      plannedMeal: true,
    },
  });
}

/** Days with anything in the food log. */
export async function getFoodDays(from: Ymd, to: Ymd): Promise<Set<Ymd>> {
  const rows = await db.foodEntry.findMany({
    where: { date: { gte: from, lte: to } },
    select: { date: true },
    distinct: ["date"],
  });
  return new Set(rows.map((r) => r.date));
}

export async function getMoods(from: Ymd, to: Ymd) {
  return db.moodLog.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });
}

/** The weight habit is the number habit measured in lbs. */
export async function getLatestWeight(): Promise<{
  value: number;
  date: Ymd;
} | null> {
  const log = await db.habitLog.findFirst({
    where: { value: { not: null }, habit: { kind: "NUMBER", unit: "lbs" } },
    orderBy: { date: "desc" },
    select: { value: true, date: true },
  });
  return log?.value != null ? { value: log.value, date: log.date } : null;
}

/** Your protein goal: the one you set, or your weight × grams per lb. */
export async function getGoals() {
  const [s, weight] = await Promise.all([getSettings(), getLatestWeight()]);
  const suggested = weight ? Math.round(weight.value * s.proteinPerLb) : null;
  return {
    calories: s.calorieGoal,
    protein: s.proteinGoal ?? suggested ?? 150,
    proteinIsAuto: s.proteinGoal == null,
    proteinSuggested: suggested,
    weight,
    proteinPerLb: s.proteinPerLb,
    meatRotation: s.meatRotation,
  };
}
