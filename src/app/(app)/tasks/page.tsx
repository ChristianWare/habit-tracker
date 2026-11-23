import PageIntro from "@/components/PageIntro/PageIntro";
import QuickAdd from "@/components/Tasks/QuickAdd";
import TaskBoard from "@/components/Tasks/TaskBoard";
import type { TaskItem } from "@/components/Tasks/types";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/data";
import { addDays, today } from "@/lib/dates";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const d = today();
  const [categories, open, done] = await Promise.all([
    getCategories(),
    db.task.findMany({
      where: { completedAt: null },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      include: { category: true, categories: true },
    }),
    db.task.findMany({
      where: {
        completedAt: { not: null },
        completions: { some: { date: { gte: addDays(d, -14) } } },
      },
      orderBy: { completedAt: "desc" },
      include: { category: true, categories: true },
    }),
  ]);

  const toItem = (t: (typeof open)[number]): TaskItem => ({
    id: t.id,
    title: t.title,
    notes: t.notes,
    dueDate: t.dueDate,
    repeat: t.repeat,
    completed: t.completedAt != null,
    categories: [t.category, ...t.categories].filter(
      (c): c is NonNullable<typeof c> => !!c,
    ),
    categoryId: t.categoryId,
    extraCategoryIds: t.categories.map((c) => c.id),
  });

  const items = open.map(toItem);
  const week = addDays(d, 7);
  const overdue = items.filter((t) => t.dueDate && t.dueDate < d);
  const todays = items.filter((t) => t.dueDate === d);
  const soon = items.filter(
    (t) => t.dueDate && t.dueDate > d && t.dueDate <= week,
  );
  const later = items.filter((t) => t.dueDate && t.dueDate > week);
  const inbox = items.filter((t) => !t.dueDate);

  const sections = [
    ...(overdue.length
      ? [{ key: "overdue", title: "Overdue", tasks: overdue }]
      : []),
    { key: "today", title: "Today", tasks: todays },
    { key: "soon", title: "Next 7 days", tasks: soon },
    {
      key: "inbox",
      title: "Inbox",
      note: "Things you jotted down without a date. Give each one a day when you're ready.",
      tasks: inbox,
    },
    ...(later.length ? [{ key: "later", title: "Later", tasks: later }] : []),
    { key: "done", title: "Done lately", tasks: done.map(toItem) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      <PageIntro
        eyebrow='Tasks'
        heading='Tasks'
        copy='One-time and repeating to-dos: the faucet, the air filter, a talk to prepare. Anything without a date waits in your inbox.'
        kpis={[
          {
            label: "Overdue",
            value: overdue.length,
            accent: overdue.length > 0,
          },
          { label: "Today", value: todays.length },
          { label: "Next 7 days", value: soon.length },
          { label: "Inbox", value: inbox.length },
        ]}
      />
      <section className='panel'>
        <h2 className='cardTitle'>Quick add</h2>
        <QuickAdd categories={categories} />
        <p className='miniNote'>
          Leave the date empty to drop it in your inbox.
        </p>
      </section>
      <TaskBoard sections={sections} categories={categories} today={d} />
    </div>
  );
}
