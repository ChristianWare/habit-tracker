import type { Metadata } from "next";
import { Suspense } from "react";
import PulseEyeBrow from "@/components/PulseEyeBrow/PulseEyeBrow";
import { LogoMark } from "@/components/icons";
import LoginForm from "./LoginForm";
import styles from "./Login.module.css";

export const metadata: Metadata = { title: "Log in" };

const STEPS = [
  {
    title: "Your focus for today",
    copy: "What's due, which part of life it belongs to, and nothing else.",
  },
  {
    title: "Watch the month fill in",
    copy: "Every finished habit crossed off on the calendar.",
  },
  {
    title: "Food, weight and mood",
    copy: "See how your days and your mood move together.",
  },
];

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <span className={styles.brand}>
          <LogoMark className={styles.logo} />
          Habit Tracker
        </span>
      </header>

      <section className={styles.grid}>
        <div className={styles.content}>
          <PulseEyeBrow text='Private' />
          <h1 className={styles.heading}>
            Welcome
            <br />
            back
          </h1>
          <p className={styles.intro}>
            This app has one login, and it&apos;s yours.
          </p>
          <div className={styles.form}>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <aside className={styles.panel}>
          <p className={styles.panelTitle}>Every day</p>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.stepText}>
                  <span className={styles.stepTitle}>{s.title}</span>
                  <span className={styles.stepCopy}>{s.copy}</span>
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}
