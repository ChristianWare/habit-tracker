"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { addDays, addMonths, isYmd, today, type Ymd } from "@/lib/dates";
import { guard, refresh, fail, type Result } from "./_shared";

const RepeatEnum = z.enum([
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
]);

const TaskInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "What needs doing?").max(140),
  notes: z.string().trim().max(1000).optional(),
  dueDate: z
    .string()
    .optional()
    .refine((d) => !d || isYmd(d), "Bad date."),
  repeat: RepeatEnum.default("NONE"),
  categoryId: z.string().optional(),
  extraCategoryIds: z.array(z.string()).default([]),
});

export type TaskInput = z.input<typeof TaskInput>;

export async function saveTask(input: TaskInput): Promise<Result> {
  try {
    await guard();
    const t = TaskInput.parse(input);
    if (t.repeat !== "NONE" && !t.dueDate)
      throw new Error("A repeating task needs a first due date.");
    const extras = t.extraCategoryIds.filter((id) => id !== t.categoryId);
    const data = {
      title: t.title,
      notes: t.notes || null,
      dueDate: t.dueDate || null,
      repeat: t.repeat,
      categoryId: t.categoryId || null,
    };
    if (t.id) {
      await db.task.update({
        where: { id: t.id },
        data: { ...data, categories: { set: extras.map((id) => ({ id })) } },
      });
    } else {
      await db.task.create({
        data: {
          ...data,
          categories: { connect: extras.map((id) => ({ id })) },
        },
      });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

function step(d: Ymd, repeat: z.infer<typeof RepeatEnum>): Ymd {
  switch (repeat) {
    case "DAILY":
      return addDays(d, 1);
    case "WEEKLY":
      return addDays(d, 7);
    case "MONTHLY":
      return addMonths(d, 1);
    case "QUARTERLY":
      return addMonths(d, 3);
    case "YEARLY":
      return addMonths(d, 12);
    default:
      return d;
  }
}

/** Done: a one-time task is finished; a repeating one moves to its next date. */
export async function completeTask(id: string): Promise<Result> {
  try {
    await guard();
    const t = await db.task.findUniqueOrThrow({ where: { id } });
    const day = today();
    if (t.repeat === "NONE" || !t.dueDate) {
      await db.$transaction([
        db.task.update({ where: { id }, data: { completedAt: new Date() } }),
        db.taskCompletion.create({ data: { taskId: id, date: day } }),
      ]);
    } else {
      let next = step(t.dueDate, t.repeat);
      while (next <= day) next = step(next, t.repeat);
      await db.$transaction([
        db.task.update({ where: { id }, data: { dueDate: next } }),
        db.taskCompletion.create({ data: { taskId: id, date: day } }),
      ]);
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Not done after all (one-time tasks). */
export async function reopenTask(id: string): Promise<Result> {
  try {
    await guard();
    const last = await db.taskCompletion.findFirst({
      where: { taskId: id },
      orderBy: { date: "desc" },
    });
    await db.$transaction([
      db.task.update({ where: { id }, data: { completedAt: null } }),
      ...(last ? [db.taskCompletion.delete({ where: { id: last.id } })] : []),
    ]);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTask(id: string): Promise<Result> {
  try {
    await guard();
    await db.task.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
