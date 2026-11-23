"use client";

import Link from "next/link";
import { useTransition } from "react";
import toast from "react-hot-toast";
import {
  archiveHabit,
  deleteHabit,
  moveHabit,
  restoreHabit,
} from "@/actions/habits";
import {
  ChevronLeft,
  ChevronRight,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import styles from "./Habits.module.css";

export default function HabitActions({
  id,
  name,
  archived,
}: {
  id: string;
  name: string;
  archived: boolean;
}) {
  const [pending, start] = useTransition();
  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    msg?: string,
  ) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "Something went wrong.");
      else if (msg) toast.success(msg);
    });

  if (archived) {
    return (
      <div className={styles.rowActions}>
        <button
          type='button'
          className='secondaryBtn'
          disabled={pending}
          onClick={() => run(() => restoreHabit(id), "Restored")}
        >
          Restore
        </button>
        <button
          type='button'
          className='ghostBtn'
          disabled={pending}
          aria-label={`Delete ${name} for good`}
          onClick={() => {
            if (
              window.confirm(
                `Delete "${name}" and all of its history? This can't be undone.`,
              )
            )
              run(() => deleteHabit(id), "Deleted");
          }}
        >
          <TrashIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.rowActions}>
      <button
        type='button'
        className='ghostBtn'
        disabled={pending}
        aria-label={`Move ${name} up`}
        onClick={() => run(() => moveHabit(id, "up"))}
      >
        <ChevronLeft style={{ transform: "rotate(90deg)" }} />
      </button>
      <button
        type='button'
        className='ghostBtn'
        disabled={pending}
        aria-label={`Move ${name} down`}
        onClick={() => run(() => moveHabit(id, "down"))}
      >
        <ChevronRight style={{ transform: "rotate(90deg)" }} />
      </button>
      <Link
        href={`/habits/${id}`}
        className='ghostBtn'
        aria-label={`Edit ${name}`}
      >
        <PencilIcon />
      </Link>
      <button
        type='button'
        className='ghostBtn'
        disabled={pending}
        onClick={() => {
          if (
            window.confirm(
              `Archive "${name}"? It stops showing from today; its history stays.`,
            )
          )
            run(
              () => archiveHabit(id),
              "Archived. Its history stays on the calendar.",
            );
        }}
      >
        Archive
      </button>
    </div>
  );
}
