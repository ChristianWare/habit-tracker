"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isYmd } from "@/lib/dates";
import { guard, refresh, fail, type Result } from "./_shared";

const HabitInput = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Give the habit a name.").max(80),
    notes: z.string().trim().max(500).optional(),
    kind: z.enum(["CHECK", "NUMBER", "FOOD_LOG"]),
    unit: z.string().trim().max(20).optional(),
    target: z.number().positive().nullable().optional(),
    schedule: z.enum(["DAYS", "WEEKLY_COUNT"]),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    timesPerWeek: z.number().int().min(1).max(7).nullable().optional(),
    dayNotes: z.record(z.string(), z.string().trim().max(60)).optional(),
    group: z.string().trim().max(40).optional(),
    meatRule: z.boolean().optional(),
    startDate: z.string().refine(isYmd, "Pick a start date."),
    categoryId: z.string().min(1, "Pick a category."),
    extraCategoryIds: z.array(z.string()).default([]),
  })
  .superRefine((h, ctx) => {
    if (h.schedule === "DAYS" && h.daysOfWeek.length === 0)
      ctx.addIssue({ code: "custom", message: "Pick at least one day." });
    if (h.schedule === "WEEKLY_COUNT" && !h.timesPerWeek)
      ctx.addIssue({ code: "custom", message: "How many times a week?" });
  });

export type HabitInput = z.input<typeof HabitInput>;

export async function saveHabit(
  input: HabitInput,
): Promise<Result & { id?: string }> {
  try {
    await guard();
    const h = HabitInput.parse(input);
    const extras = h.extraCategoryIds.filter((id) => id !== h.categoryId);
    const dayNotes = Object.fromEntries(
      Object.entries(h.dayNotes ?? {}).filter(([, v]) => v),
    );

    const data = {
      name: h.name,
      notes: h.notes || null,
      kind: h.kind,
      unit: h.kind === "NUMBER" ? h.unit || null : null,
      target: h.kind === "NUMBER" ? (h.target ?? null) : null,
      schedule: h.schedule,
      daysOfWeek: [...new Set(h.daysOfWeek)].sort(),
      timesPerWeek:
        h.schedule === "WEEKLY_COUNT" ? (h.timesPerWeek ?? 1) : null,
      dayNotes: Object.keys(dayNotes).length ? dayNotes : Prisma.DbNull,
      group: h.group || null,
      meatRule: h.meatRule ?? false,
      startDate: h.startDate,
      categoryId: h.categoryId,
    };

    if (h.id) {
      await db.habit.update({
        where: { id: h.id },
        data: {
          ...data,
          categories: { set: extras.map((id) => ({ id })) },
        },
      });
      refresh();
      return { ok: true, id: h.id };
    }

    const last = await db.habit.aggregate({ _max: { sortOrder: true } });
    const row = await db.habit.create({
      data: {
        ...data,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
        categories: { connect: extras.map((id) => ({ id })) },
      },
    });
    refresh();
    return { ok: true, id: row.id };
  } catch (e) {
    return fail(e);
  }
}

/** Stop showing it from today on. Its history stays on the calendar. */
export async function archiveHabit(id: string): Promise<Result> {
  try {
    await guard();
    await db.habit.update({ where: { id }, data: { archivedAt: new Date() } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function restoreHabit(id: string): Promise<Result> {
  try {
    await guard();
    await db.habit.update({ where: { id }, data: { archivedAt: null } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Gone for good, history included. */
export async function deleteHabit(id: string): Promise<Result> {
  try {
    await guard();
    await db.habit.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Swap a habit with its neighbour above or below in the list. */
export async function moveHabit(
  id: string,
  dir: "up" | "down",
): Promise<Result> {
  try {
    await guard();
    const all = await db.habit.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const i = all.findIndex((h) => h.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= all.length) return { ok: true };
    [all[i], all[j]] = [all[j], all[i]];
    await db.$transaction(
      all.map((h, n) =>
        db.habit.update({ where: { id: h.id }, data: { sortOrder: n } }),
      ),
    );
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
