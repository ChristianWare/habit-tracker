"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { isYmd } from "@/lib/dates";
import { guard, refresh, fail, type Result } from "./_shared";

const SetMood = z.object({
  date: z.string().refine(isYmd, "Bad date."),
  score: z.number().int().min(1).max(10),
  note: z.string().trim().max(280).optional(),
});

export async function setMood(input: z.input<typeof SetMood>): Promise<Result> {
  try {
    await guard();
    const { date, score, note } = SetMood.parse(input);
    await db.moodLog.upsert({
      where: { date },
      create: { date, score, note: note || null },
      update: { score, note: note || null },
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function clearMood(date: string): Promise<Result> {
  try {
    await guard();
    if (!isYmd(date)) throw new Error("Bad date.");
    await db.moodLog.deleteMany({ where: { date } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
