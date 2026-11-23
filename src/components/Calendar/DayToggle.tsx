"use client";

// A habit on a past day, below the calendar: check it off after the fact.

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { setHabitLog } from "@/actions/logs";
import { CheckIcon } from "@/components/icons";
import styles from "./Calendar.module.css";

export default function DayToggle({
  habitId,
  date,
  name,
  color,
  kind,
  unit,
  weekly,
  done: initialDone,
  value: initialValue,
}: {
  habitId: string;
  date: string;
  name: string;
  color: string;
  kind: "CHECK" | "NUMBER" | "FOOD_LOG";
  unit: string | null;
  weekly: boolean;
  done: boolean;
  value: number | null;
}) {
  const [done, setDone] = useState(initialDone);
  const [value, setValue] = useState(
    initialValue != null ? String(initialValue) : "",
  );
  const [pending, start] = useTransition();

  const save = (
    entry: Parameters<typeof setHabitLog>[0]["entry"],
    undo: () => void,
  ) =>
    start(async () => {
      const res = await setHabitLog({ habitId, date, entry });
      if (!res.ok) {
        undo();
        toast.error(res.error);
      }
    });

  return (
    <li className={styles.dayItem}>
      <span className='dot' style={{ backgroundColor: color }} />
      <span className={styles.dayName}>
        {name}
        {weekly ? <span className={styles.dayTag}>weekly</span> : null}
      </span>
      {kind === "CHECK" ? (
        <button
          type='button'
          className={`${styles.dayCheck} ${done ? styles.dayCheckOn : ""}`}
          aria-pressed={done}
          aria-label={done ? `Undo ${name}` : `Mark ${name} done`}
          disabled={pending}
          onClick={() => {
            const next = !done;
            setDone(next);
            save(next ? { done: true } : null, () => setDone(!next));
          }}
        >
          {done ? <CheckIcon /> : null}
        </button>
      ) : kind === "NUMBER" ? (
        <form
          className={styles.dayNumber}
          onSubmit={(e) => {
            e.preventDefault();
            const v = value.trim() === "" ? null : Number(value);
            if (v != null && !Number.isFinite(v))
              return void toast.error("Enter a number.");
            save(v == null ? null : { done: true, value: v }, () => {});
            toast.success("Saved");
          }}
        >
          <input
            className='input'
            inputMode='decimal'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`${name} (${unit ?? ""})`}
          />
          <span className='miniNote'>{unit}</span>
          <button type='submit' className='secondaryBtn' disabled={pending}>
            Save
          </button>
        </form>
      ) : (
        <span className='miniNote'>
          {done ? "Food logged" : "No food logged"}
        </span>
      )}
    </li>
  );
}
