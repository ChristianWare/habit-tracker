"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { saveTask } from "@/actions/tasks";
import type { CategoryRef } from "@/components/ui/CategoryPill";
import { REPEAT_LABELS, type TaskItem } from "./types";
import styles from "./Tasks.module.css";

export default function TaskForm({
  task,
  categories,
  onDone,
}: {
  task?: TaskItem;
  categories: CategoryRef[];
  onDone: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [repeat, setRepeat] = useState<TaskItem["repeat"]>(
    task?.repeat ?? "NONE",
  );
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? "");
  const [extra, setExtra] = useState<string[]>(task?.extraCategoryIds ?? []);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveTask({
        id: task?.id,
        title,
        notes,
        dueDate: dueDate || undefined,
        repeat,
        categoryId: categoryId || undefined,
        extraCategoryIds: extra,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(task ? "Task saved" : "Task added");
      onDone();
    });
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={`field ${styles.full}`}>
        <span className='label'>Task</span>
        <input
          className='input'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          required
        />
      </label>
      <label className='field'>
        <span className='label'>Due date</span>
        <input
          type='date'
          className='input'
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>
      <label className='field'>
        <span className='label'>Repeats</span>
        <select
          className='select'
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as TaskItem["repeat"])}
        >
          {Object.entries(REPEAT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className='field'>
        <span className='label'>Category</span>
        <select
          className='select'
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value=''>No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className='field'>
        <legend className='label'>Also counts toward</legend>
        <div className={styles.checks}>
          {categories
            .filter((c) => c.id !== categoryId)
            .map((c) => (
              <label key={c.id} className='pill' style={{ cursor: "pointer" }}>
                <input
                  type='checkbox'
                  checked={extra.includes(c.id)}
                  onChange={(e) =>
                    setExtra((x) =>
                      e.target.checked
                        ? [...x, c.id]
                        : x.filter((i) => i !== c.id),
                    )
                  }
                />
                {c.name}
              </label>
            ))}
        </div>
      </fieldset>
      <label className={`field ${styles.full}`}>
        <span className='label'>Notes</span>
        <textarea
          className='textarea'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
        />
      </label>
      <div className={styles.formActions}>
        <button type='submit' className='primaryBtn' disabled={pending}>
          {pending ? "Saving…" : task ? "Save task" : "Add task"}
        </button>
        <button type='button' className='secondaryBtn' onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
