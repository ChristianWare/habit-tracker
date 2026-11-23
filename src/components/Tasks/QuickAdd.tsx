"use client";

// The fastest way to get a sticky note out of your head: type it, pick a
// day if it has one, and it's saved.

import { useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { saveTask } from "@/actions/tasks";
import type { CategoryRef } from "@/components/ui/CategoryPill";
import styles from "./Tasks.module.css";

export default function QuickAdd({
  categories,
  defaultDate,
  placeholder = "Add a task…",
  compact = false,
}: {
  categories: CategoryRef[];
  defaultDate?: string;
  placeholder?: string;
  /** Narrow column: the title gets its own line. */
  compact?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    start(async () => {
      const res = await saveTask({
        title,
        dueDate: date || undefined,
        categoryId: categoryId || undefined,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(date ? "Task added" : "Added to your inbox");
      setTitle("");
      input.current?.focus();
    });
  };

  return (
    <form
      className={`${styles.quick} ${compact ? styles.compact : ""}`}
      onSubmit={submit}
    >
      <input
        ref={input}
        className={`input ${styles.quickTitle}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        aria-label='Task'
        maxLength={140}
      />
      <input
        type='date'
        className={`input ${styles.quickDate}`}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label='Due date (leave empty for your inbox)'
      />
      <select
        className={`select ${styles.quickCat}`}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        aria-label='Category'
      >
        <option value=''>No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type='submit'
        className='primaryBtn'
        disabled={pending || !title.trim()}
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
