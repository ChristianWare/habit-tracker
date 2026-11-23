"use client";

// The Tasks page: overdue, today, coming up, your inbox (no date yet) and
// what you finished lately. Each task opens into a form to edit it.

import { useState } from "react";
import type { CategoryRef } from "@/components/ui/CategoryPill";
import { PlusIcon } from "@/components/icons";
import TaskRow from "./TaskRow";
import TaskForm from "./TaskForm";
import type { TaskItem } from "./types";
import todayStyles from "@/components/Today/Today.module.css";
import styles from "./Tasks.module.css";

type Section = { key: string; title: string; note?: string; tasks: TaskItem[] };

export default function TaskBoard({
  sections,
  categories,
  today,
}: {
  sections: Section[];
  categories: CategoryRef[];
  today: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className={todayStyles.stack}>
      <section className='panel'>
        <h2 className='cardTitle'>
          New task
          {editing !== "new" ? (
            <button
              type='button'
              className='secondaryBtn'
              onClick={() => setEditing("new")}
            >
              <PlusIcon width={16} height={16} /> More options
            </button>
          ) : null}
        </h2>
        {editing === "new" ? (
          <TaskForm categories={categories} onDone={() => setEditing(null)} />
        ) : null}
      </section>

      {sections.map((s) => (
        <section key={s.key} className='panel'>
          <h2 className='cardTitle'>
            {s.title}
            <small>{s.tasks.length || ""}</small>
          </h2>
          {s.note ? <p className='miniNote'>{s.note}</p> : null}
          {s.tasks.length ? (
            <ul className={todayStyles.list}>
              {s.tasks.map((t) =>
                editing === t.id ? (
                  <li
                    key={t.id}
                    className={styles.section}
                    style={{ padding: "1.2rem 0" }}
                  >
                    <TaskForm
                      task={t}
                      categories={categories}
                      onDone={() => setEditing(null)}
                    />
                  </li>
                ) : (
                  <TaskRow
                    key={`${t.id}-${t.completed}-${t.dueDate}`}
                    t={t}
                    today={today}
                    onEdit={t.completed ? undefined : () => setEditing(t.id)}
                    allowDelete
                  />
                ),
              )}
            </ul>
          ) : (
            <p className='empty'>Nothing here.</p>
          )}
        </section>
      ))}
    </div>
  );
}
