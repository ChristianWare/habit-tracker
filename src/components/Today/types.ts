import type { CategoryRef } from "@/components/ui/CategoryPill";

export type TodayHabit = {
  id: string;
  name: string;
  notes: string | null;
  kind: "CHECK" | "NUMBER" | "FOOD_LOG";
  unit: string | null;
  target: number | null;
  categories: CategoryRef[];
  /** Today's focus note ("Kitchen"). */
  dayNote: string | null;
  done: boolean;
  value: number | null;
  weekly: { done: number; target: number } | null;
  streak: { count: number; unit: "day" | "week" };
  meat: {
    label: string;
    meal: string | null;
    /** The day this week's planned meal was used, if it was. */
    usedOn: string | null;
    plannedToday: boolean;
  } | null;
};

export type TodayBlock = {
  key: string;
  title: string;
  color: string | null;
  habits: TodayHabit[];
};
