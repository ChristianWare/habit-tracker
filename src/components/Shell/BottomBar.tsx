"use client";

// Phones and tablets: a bar along the bottom with Today, Calendar, Food,
// Tasks and More. More opens a sheet with the other pages and Sign out.

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import { ChevronRight } from "@/components/icons";
import { ALL_ITEMS, TAB_KEYS, activeHref } from "./nav";
import styles from "./Shell.module.css";

export default function BottomBar() {
  const pathname = usePathname() ?? "/";
  const active = activeHref(pathname);
  // Open only on the page it was opened on, so a link closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const tabs = ALL_ITEMS.filter((i) => TAB_KEYS.includes(i.key));
  const more = ALL_ITEMS.filter((i) => !TAB_KEYS.includes(i.key));
  const moreActive = more.some((i) => i.href === active);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <nav className={styles.bar} aria-label='Pages'>
        <ul className={styles.tabs}>
          {tabs.map((t) => {
            const on = t.href === active;
            return (
              <li key={t.key}>
                <Link
                  href={t.href}
                  className={`${styles.tab} ${on ? styles.tabActive : ""}`}
                  aria-current={on ? "page" : undefined}
                >
                  <span className={styles.tabIcon}>{t.icon}</span>
                  {t.short}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type='button'
              className={`${styles.tab} ${moreActive || open ? styles.tabActive : ""}`}
              onClick={() => setOpenOn(open ? null : pathname)}
              aria-expanded={open}
              aria-controls='more-sheet'
            >
              <span className={styles.tabIcon}>
                <span className={styles.dots}>
                  <span />
                  <span />
                  <span />
                </span>
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
        onClick={() => setOpenOn(null)}
        aria-hidden='true'
      />
      <div
        id='more-sheet'
        className={`${styles.sheet} ${open ? styles.sheetOpen : ""}`}
        role='dialog'
        aria-modal='true'
        aria-label='More pages'
        inert={!open}
      >
        <span className={styles.handle} aria-hidden='true' />
        <ul className={styles.sheetLinks}>
          {more.map((m) => {
            const on = m.href === active;
            return (
              <li key={m.key}>
                <Link
                  href={m.href}
                  className={`${styles.sheetLink} ${on ? styles.sheetLinkActive : ""}`}
                  onClick={() => setOpenOn(null)}
                >
                  <span className={styles.sheetIcon}>{m.icon}</span>
                  {m.title}
                  <ChevronRight className={styles.sheetArrow} />
                </Link>
              </li>
            );
          })}
        </ul>
        <form action={logout}>
          <button type='submit' className={styles.logOut}>
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
