"use client";

// The last thing on Today: how was the day, 1 to 10, with an optional line.

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { setMood } from "@/actions/mood";
import MoodFace, { MOOD_WORDS } from "./MoodFace";
import styles from "./Mood.module.css";

export default function MoodCheck({
  date,
  initialScore,
  initialNote,
}: {
  date: string;
  initialScore: number | null;
  initialNote: string | null;
}) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [note, setNote] = useState(initialNote ?? "");
  const [saved, setSaved] = useState(initialScore != null);
  const [pending, start] = useTransition();

  const save = (s: number, n: string) =>
    start(async () => {
      const res = await setMood({ date, score: s, note: n });
      if (!res.ok) toast.error(res.error);
      else {
        setSaved(true);
        toast.success("Mood saved");
      }
    });

  return (
    <section className='panel' aria-labelledby='mood-title'>
      <h2 id='mood-title' className='cardTitle'>
        How was today?
        <small>
          {saved && score
            ? `Saved: ${score} · ${MOOD_WORDS[score]}`
            : "1 is awful, 10 is amazing"}
        </small>
      </h2>

      <div
        className={styles.faces}
        role='radiogroup'
        aria-label='Mood, 1 to 10'
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type='button'
            role='radio'
            aria-checked={score === n}
            aria-label={`${n}, ${MOOD_WORDS[n]}`}
            className={`${styles.face} ${score === n ? styles.faceOn : ""}`}
            onClick={() => {
              setScore(n);
              setSaved(false);
            }}
          >
            <MoodFace
              score={n}
              size={36}
              muted={score != null && score !== n}
            />
            <span className={styles.faceNum}>{n}</span>
          </button>
        ))}
      </div>

      {score ? (
        <div className={styles.after}>
          <label className='field'>
            <span className='label'>What made it a {score}? (optional)</span>
            <input
              className='input'
              value={note}
              maxLength={280}
              placeholder='Great service morning, tired after work…'
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <button
            type='button'
            className='primaryBtn'
            disabled={pending || saved}
            onClick={() => save(score, note)}
          >
            {saved ? "Saved" : pending ? "Saving…" : "Save mood"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
