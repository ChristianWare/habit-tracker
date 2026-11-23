import PageIntro from "@/components/PageIntro/PageIntro";
import HabitForm from "@/components/Habits/HabitForm";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/data";
import { today } from "@/lib/dates";

export const metadata = { title: "Add a habit" };

export default async function NewHabitPage() {
  const [categories, groups] = await Promise.all([
    getCategories(),
    db.habit.findMany({
      where: { group: { not: null } },
      distinct: ["group"],
      select: { group: true },
    }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      <PageIntro eyebrow='Habits' heading='Add a habit' />
      <HabitForm
        categories={categories}
        groups={groups.map((g) => g.group!).filter(Boolean)}
        initial={{
          name: "",
          notes: "",
          kind: "CHECK",
          unit: "",
          target: "",
          schedule: "DAYS",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          timesPerWeek: "3",
          dayNotes: {},
          group: "",
          meatRule: false,
          startDate: today(),
          categoryId: categories[0]?.id ?? "",
          extraCategoryIds: [],
        }}
      />
    </div>
  );
}
