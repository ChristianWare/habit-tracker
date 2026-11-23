import { notFound } from "next/navigation";
import PageIntro from "@/components/PageIntro/PageIntro";
import HabitForm from "@/components/Habits/HabitForm";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/data";

export const metadata = { title: "Edit habit" };

export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [h, categories, groups] = await Promise.all([
    db.habit.findUnique({
      where: { id },
      include: { categories: { select: { id: true } } },
    }),
    getCategories(),
    db.habit.findMany({
      where: { group: { not: null } },
      distinct: ["group"],
      select: { group: true },
    }),
  ]);
  if (!h) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      <PageIntro
        eyebrow='Habits'
        heading={h.name}
        copy='Edit anything here. Your past check-offs stay as they are.'
      />
      <HabitForm
        categories={categories}
        groups={groups.map((g) => g.group!).filter(Boolean)}
        initial={{
          id: h.id,
          name: h.name,
          notes: h.notes ?? "",
          kind: h.kind,
          unit: h.unit ?? "",
          target: h.target != null ? String(h.target) : "",
          schedule: h.schedule,
          daysOfWeek: h.daysOfWeek,
          timesPerWeek: h.timesPerWeek != null ? String(h.timesPerWeek) : "3",
          dayNotes: (h.dayNotes as Record<string, string> | null) ?? {},
          group: h.group ?? "",
          meatRule: h.meatRule,
          startDate: h.startDate,
          categoryId: h.categoryId,
          extraCategoryIds: h.categories.map((c) => c.id),
        }}
      />
    </div>
  );
}
