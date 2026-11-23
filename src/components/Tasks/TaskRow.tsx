"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { completeTask, deleteTask, reopenTask } from "@/actions/tasks";
import {
  CheckIcon,
  PencilIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";
import CategoryPill from "@/components/ui/CategoryPill";
import { relativeDay } from "@/lib/dates";
import { REPEAT_LABELS, type TaskItem } from "./types";
import styles from "@/components/Today/Today.module.css";

export default function TaskRow({
  t,
  today,
  onEdit,
  allowDelete = false,
}: {
  t: TaskItem;
  today: string;
  onEdit?: () => void;
  allowDelete?: boolean;
}) {
  const [done, setDone] = useState(t.completed);
  const [gone, setGone] = useState(false);
  const [pending, start] = useTransition();

  if (gone) return null;

  const toggle = () => {
    const next = !done;
    setDone(next);
    start(async () => {
      const res = next ? await completeTask(t.id) : await reopenTask(t.id);
      if (!res.ok) {
        setDone(!next);
        toast.error(res.error);
      } else if (next && t.repeat !== "NONE") {
        toast.success(`Done. Next: ${REPEAT_LABELS[t.repeat].toLowerCase()}.`);
      }
    });
  };

  const remove = () =>
    start(async () => {
      setGone(true);
      const res = await deleteTask(t.id);
      if (!res.ok) {
        setGone(false);
        toast.error(res.error);
      } else toast.success("Task deleted");
    });

  const overdue = !done && t.dueDate != null && t.dueDate < today;

  return (
    <li className={`${styles.row} ${done ? styles.rowDone : ""}`}>
      <button
        type='button'
        className={`${styles.check} ${styles.checkRound} ${done ? styles.checkOn : ""}`}
        onClick={toggle}
        disabled={pending}
        aria-pressed={done}
        aria-label={
          done ? `${t.title}: done. Tap to undo.` : `Mark ${t.title} done`
        }
      >
        {done ? <CheckIcon /> : null}
      </button>
      <div className={styles.body}>
        <p className={styles.name}>{t.title}</p>
        <div className={styles.meta}>
          {t.categories.map((c) => (
            <CategoryPill key={c.id} c={c} />
          ))}
          {t.dueDate ? (
            <span
              className={`${styles.metaText} ${overdue ? styles.metaBad : ""}`}
            >
              {overdue ? "Overdue · " : ""}
              {relativeDay(t.dueDate, today)}
            </span>
          ) : (
            <span className={styles.metaText}>No date</span>
          )}
          {t.repeat !== "NONE" ? (
            <span className={styles.metaText}>
              <RepeatIcon className={styles.inlineIcon} />{" "}
              {REPEAT_LABELS[t.repeat]}
            </span>
          ) : null}
        </div>
        {t.notes ? <p className={styles.notes}>{t.notes}</p> : null}
      </div>
      {onEdit || allowDelete ? (
        <div className={styles.rowActions}>
          {onEdit ? (
            <button
              type='button'
              className='ghostBtn'
              onClick={onEdit}
              aria-label={`Edit ${t.title}`}
            >
              <PencilIcon className={styles.btnIcon} />
            </button>
          ) : null}
          {allowDelete ? (
            <button
              type='button'
              className='ghostBtn'
              onClick={remove}
              disabled={pending}
              aria-label={`Delete ${t.title}`}
            >
              <TrashIcon className={styles.btnIcon} />
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
