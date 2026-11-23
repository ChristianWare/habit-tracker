"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { isYmd, today, addDays } from "@/lib/dates";
import { guard, refresh, fail, type Result } from "./_shared";

const Ymd = z.string().refine(isYmd, "Bad date.");

const SetLog = z.object({
  habitId: z.string().min(1),
  date: Ymd,
  /** null removes the day's entry. */
  entry: z
    .object({
      done: z.boolean().default(true),
      value: z.number().finite().nullable().optional(),
      plannedMeal: z.boolean().optional(),
    })
    .nullable(),
});

/** Check off, uncheck, mark missed or log a number for a habit on a day. */
export async function setHabitLog(
  input: z.input<typeof SetLog>,
): Promise<Result> {
  try {
    await guard();
    const { habitId, date, entry } = SetLog.parse(input);
    if (date > addDays(today(), 1))
      throw new Error("That day hasn't come yet.");

    if (!entry) {
      await db.habitLog.deleteMany({ where: { habitId, date } });
    } else {
      const data = {
        done: entry.done,
        value: entry.value ?? null,
        plannedMeal: entry.plannedMeal ?? false,
      };
      await db.habitLog.upsert({
        where: { habitId_date: { habitId, date } },
        create: { habitId, date, ...data },
        update: data,
      });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
