import styles from "@/components/Today/Today.module.css";

/** A labelled bar: how far a number is toward its goal. */
export default function Meter({
  label,
  value,
  goal,
  unit = "",
  gold = false,
  limit = false,
}: {
  label: string;
  value: number;
  goal: number | null;
  unit?: string;
  gold?: boolean;
  /** A ceiling (added sugar), not a target: going over turns red. */
  limit?: boolean;
}) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  const over = limit && goal != null && value > goal;
  const v = Math.round(value).toLocaleString();
  return (
    <div className={styles.meter}>
      <div className={styles.meterTop}>
        <span>{label}</span>
        <span>
          <strong>
            {v}
            {unit}
          </strong>
          {goal ? ` / ${goal.toLocaleString()}${unit}` : ""}
        </span>
      </div>
      {goal ? (
        <div
          className={styles.track}
          role='progressbar'
          aria-label={label}
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={goal}
        >
          <div
            className={`${styles.fill} ${gold ? styles.fillGold : ""}`}
            style={{
              width: `${pct}%`,
              backgroundColor: over ? "var(--danger)" : undefined,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
