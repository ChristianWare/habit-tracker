"use client";

// One habit on Today: a big check box, its name and categories, and what
// it needs today. Number habits take a number; the meatless habit can
// use the week's planned meal.

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { setHabitLog } from "@/actions/logs";
import { CheckIcon, FlameIcon } from "@/components/icons";
import CategoryPill from "@/components/ui/CategoryPill";
import { dayLabel } from "@/lib/dates";
import type { TodayHabit } from "./types";
import styles from "./Today.module.css";

export default function HabitRow({ h, date }: { h: TodayHabit; date: string }) {
  const [done, setDone] = useState(h.done);
  const [value, setValue] = useState(h.value != null ? String(h.value) : "");
  const [planned, setPlanned] = useState(h.meat?.plannedToday ?? false);
  const [pending, start] = useTransition();

  const weeklyMet = h.weekly
    ? h.weekly.done - (h.done ? 1 : 0) + (done ? 1 : 0) >= h.weekly.target
    : false;

  const run = (
    entry: Parameters<typeof setHabitLog>[0]["entry"],
    undo: () => void,
  ) =>
    start(async () => {
      const res = await setHabitLog({ habitId: h.id, date, entry });
      if (!res.ok) {
        undo();
        toast.error(res.error);
      }
    });

  const toggle = () => {
    if (h.kind === "FOOD_LOG") return;
    const next = !done;
    setDone(next);
    if (!next) setPlanned(false);
    run(next ? { done: true } : null, () => setDone(!next));
  };

  const saveNumber = () => {
    const v = value.trim() === "" ? null : Number(value);
    if (v != null && !Number.isFinite(v)) return toast.error("Enter a number.");
    const prev = done;
    const nextDone = v != null && (h.target == null || v >= h.target);
    setDone(nextDone);
    run(v == null ? null : { done: nextDone, value: v }, () => setDone(prev));
    if (v != null) toast.success(`${h.name}: ${v} ${h.unit ?? ""}`.trim());
  };

  const usePlanned = () => {
    const was = { done, planned };
    setDone(true);
    setPlanned(true);
    run({ done: true, plannedMeal: true }, () => {
      setDone(was.done);
      setPlanned(was.planned);
    });
  };

  const isNumber = h.kind === "NUMBER";
  const auto = h.kind === "FOOD_LOG";

  return (
    <li className={`${styles.row} ${done ? styles.rowDone : ""}`}>
      <button
        type='button'
        className={`${styles.check} ${done ? styles.checkOn : ""}`}
        onClick={isNumber ? undefined : toggle}
        disabled={pending || auto || isNumber}
        aria-pressed={done}
        aria-label={
          done ? `${h.name}: done. Tap to undo.` : `Mark ${h.name} done`
        }
        title={
          auto
            ? "Checks itself off when you log food"
            : isNumber
              ? "Done when you log the number"
              : undefined
        }
      >
        {done ? <CheckIcon /> : null}
      </button>

      <div className={styles.body}>
        <p className={styles.name}>{h.name}</p>
        <div className={styles.meta}>
          {h.categories.map((c) => (
            <CategoryPill key={c.id} c={c} />
          ))}
          {h.dayNote ? (
            <span className={styles.focus}>Today: {h.dayNote}</span>
          ) : null}
          {h.weekly ? (
            <span
              className={`${styles.metaText} ${weeklyMet ? styles.metaGood : ""}`}
            >
              {Math.min(h.weekly.done - (h.done ? 1 : 0) + (done ? 1 : 0), 99)}{" "}
              of {h.weekly.target} this week
            </span>
          ) : null}
          {h.streak.count >= 2 ? (
            <span className={styles.streak}>
              <FlameIcon /> {h.streak.count}-{h.streak.unit} streak
            </span>
          ) : null}
          {auto ? (
            <span className={styles.metaText}>Log food to check this off</span>
          ) : null}
        </div>
        {h.meat ? (
          <p className={styles.meatLine}>
            <strong>{h.meat.label}.</strong>{" "}
            {h.meat.meal == null
              ? "No meat this week."
              : planned
                ? `Today is your planned ${h.meat.meal} meal.`
                : h.meat.usedOn
                  ? `Planned ${h.meat.meal} meal used ${dayLabel(h.meat.usedOn)}.`
                  : `One planned ${h.meat.meal} meal left this week.`}
          </p>
        ) : null}
      </div>

      {isNumber ? (
        <form
          className={styles.numberForm}
          onSubmit={(e) => {
            e.preventDefault();
            saveNumber();
          }}
        >
          <input
            className={`input ${styles.numberInput}`}
            inputMode='decimal'
            value={value}
            placeholder={h.target ? String(h.target) : "0"}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`${h.name} in ${h.unit ?? "units"}`}
          />
          <span className={styles.unit}>{h.unit}</span>
          <button type='submit' className='secondaryBtn' disabled={pending}>
            Save
          </button>
        </form>
      ) : null}

      {h.meat?.meal && !h.meat.usedOn && !planned ? (
        <button
          type='button'
          className={`ghostBtn ${styles.sideBtn}`}
          onClick={usePlanned}
          disabled={pending}
        >
          Had my {h.meat.meal} meal
        </button>
      ) : null}
    </li>
  );
}
