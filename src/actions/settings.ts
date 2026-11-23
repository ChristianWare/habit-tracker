"use server";

import { z } from "zod";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { guard, refresh, fail, type Result } from "./_shared";

const Goals = z.object({
  calorieGoal: z.number().int().min(800, "That's too low.").max(10000),
  proteinGoal: z.number().int().min(20).max(500).nullable(),
  proteinPerLb: z.number().min(0.3).max(1.5),
  meatRotation: z.boolean(),
});

export async function saveGoals(input: z.input<typeof Goals>): Promise<Result> {
  try {
    await guard();
    const g = Goals.parse(input);
    await db.settings.upsert({
      where: { id: "app" },
      create: { id: "app", ...g },
      update: g,
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const CategoryInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name the category.").max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour."),
});

export async function saveCategory(
  input: z.input<typeof CategoryInput>,
): Promise<Result> {
  try {
    await guard();
    const { id, ...c } = CategoryInput.parse(input);
    if (id) {
      await db.category.update({ where: { id }, data: c });
    } else {
      const last = await db.category.aggregate({ _max: { sortOrder: true } });
      await db.category.create({
        data: { ...c, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function moveCategory(
  id: string,
  dir: "up" | "down",
): Promise<Result> {
  try {
    await guard();
    const all = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const i = all.findIndex((c) => c.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= all.length) return { ok: true };
    [all[i], all[j]] = [all[j], all[i]];
    await db.$transaction(
      all.map((c, n) =>
        db.category.update({ where: { id: c.id }, data: { sortOrder: n } }),
      ),
    );
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Only when no habit uses it as its main category. Tasks keep going, uncategorised. */
export async function deleteCategory(id: string): Promise<Result> {
  try {
    await guard();
    const used = await db.habit.count({ where: { categoryId: id } });
    if (used)
      throw new Error(
        `${used} habit${used === 1 ? " uses" : "s use"} this category. Move ${used === 1 ? "it" : "them"} first.`,
      );
    await db.category.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const PasswordInput = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z.string().min(12, "Use at least 12 characters."),
});

export async function changePassword(
  input: z.input<typeof PasswordInput>,
): Promise<Result> {
  try {
    const user = await guard();
    const { current, next } = PasswordInput.parse(input);
    const owner = await db.owner.findUniqueOrThrow({ where: { id: user.id! } });
    if (!(await bcryptjs.compare(current, owner.passwordHash)))
      throw new Error("Your current password isn't right.");
    await db.owner.update({
      where: { id: owner.id },
      data: { passwordHash: await bcryptjs.hash(next, 12) },
    });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
