// The top of every page, as on the dashboards: a pulsing label, the
// condensed heading, a line of copy and up to four numbers.

import Link from "next/link";
import type { ReactNode } from "react";
import PulseEyeBrow from "@/components/PulseEyeBrow/PulseEyeBrow";
import styles from "./PageIntro.module.css";

export type Kpi = {
  label: string;
  value: ReactNode;
  sub?: string;
  href?: string;
  /** Gold left edge. */
  accent?: boolean;
};

export default function PageIntro({
  eyebrow,
  heading,
  copy,
  kpis,
  actions,
}: {
  eyebrow: string;
  heading: ReactNode;
  copy?: ReactNode;
  kpis?: Kpi[];
  actions?: ReactNode;
}) {
  return (
    <header className={styles.container}>
      <div className={styles.intro}>
        <PulseEyeBrow text={eyebrow} />
        <h1 className={styles.heading}>{heading}</h1>
        {copy ? <p className={styles.copy}>{copy}</p> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>

      {kpis?.length ? (
        <div
          className={styles.kpis}
          style={{ ["--cols" as string]: Math.min(kpis.length, 4) }}
        >
          {kpis.map((k) => {
            const body = (
              <>
                <span className={styles.kpiLabel}>{k.label}</span>
                <span className={styles.kpiValue}>{k.value}</span>
                {k.sub ? <span className={styles.kpiSub}>{k.sub}</span> : null}
              </>
            );
            const cls = `${styles.kpi} ${k.accent ? styles.kpiAccent : ""}`;
            return k.href ? (
              <Link
                key={k.label}
                href={k.href}
                className={`${cls} ${styles.kpiLink}`}
              >
                {body}
              </Link>
            ) : (
              <div key={k.label} className={cls}>
                {body}
              </div>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
