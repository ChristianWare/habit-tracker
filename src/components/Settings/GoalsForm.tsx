"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { saveGoals } from "@/actions/settings";
import styles from "./Settings.module.css";

export default function GoalsForm({
  calorieGoal,
  proteinGoal,
  proteinPerLb,
  meatRotation,
  suggested,
}: {
  calorieGoal: number;
  proteinGoal: number | null;
  proteinPerLb: number;
  meatRotation: boolean;
  suggested: number | null;
}) {
  const [cal, setCal] = useState(String(calorieGoal));
  const [auto, setAuto] = useState(proteinGoal == null);
  const [protein, setProtein] = useState(
    String(proteinGoal ?? suggested ?? 150),
  );
  const [perLb, setPerLb] = useState(String(proteinPerLb));
  const [meat, setMeat] = useState(meatRotation);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveGoals({
        calorieGoal: Number(cal),
        proteinGoal: auto ? null : Number(protein),
        proteinPerLb: Number(perLb),
        meatRotation: meat,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Goals saved");
    });
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className='field'>
        <span className='label'>Calories a day</span>
        <input
          className='input'
          inputMode='numeric'
          value={cal}
          onChange={(e) => setCal(e.target.value)}
        />
      </label>

      <fieldset className={`field ${styles.full}`}>
        <legend className='label'>Protein a day</legend>
        <label className={styles.check}>
          <input
            type='checkbox'
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
          Work it out from my weight
        </label>
        {auto ? (
          <label className={styles.inline}>
            <input
              className='input'
              inputMode='decimal'
              value={perLb}
              onChange={(e) => setPerLb(e.target.value)}
              aria-label='Grams per pound'
            />
            <span className='miniNote'>
              g per lb
              {suggested
                ? ` = ${suggested} g today`
                : " (log your weight first)"}
            </span>
          </label>
        ) : (
          <label className={styles.inline}>
            <input
              className='input'
              inputMode='numeric'
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              aria-label='Grams of protein'
            />
            <span className='miniNote'>g</span>
          </label>
        )}
        <span className='miniNote'>
          A common range for active people is 0.7–1 g per lb. Check with your
          doctor if you have a health condition.
        </span>
      </fieldset>

      <label className={`${styles.check} ${styles.full}`}>
        <input
          type='checkbox'
          checked={meat}
          onChange={(e) => setMeat(e.target.checked)}
        />
        <span>
          <strong>Meat rotation</strong>
          <span className='miniNote' style={{ display: "block" }}>
            Weeks starting on the 1st–7th: red meat. 8th–14th: fish. 15th–21st:
            chicken. After that: meatless. One planned meal a week.
          </span>
        </span>
      </label>

      <div className={styles.full}>
        <button type='submit' className='primaryBtn' disabled={pending}>
          {pending ? "Saving…" : "Save goals"}
        </button>
      </div>
    </form>
  );
}
