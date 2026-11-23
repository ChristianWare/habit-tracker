import type { CategoryRef } from "@/components/ui/CategoryPill";

export type TaskItem = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  repeat: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  completed: boolean;
  categories: CategoryRef[];
  categoryId: string | null;
  extraCategoryIds: string[];
};

export const REPEAT_LABELS: Record<TaskItem["repeat"], string> = {
  NONE: "Doesn't repeat",
  DAILY: "Every day",
  WEEKLY: "Every week",
  MONTHLY: "Every month",
  QUARTERLY: "Every 3 months",
  YEARLY: "Every year",
};
