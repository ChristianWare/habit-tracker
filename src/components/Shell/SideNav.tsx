"use client";

// Desktop navigation: the pages in groups, the current one in gold, and
// Sign out at the bottom. Hidden at 1068px and below (see BottomBar).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import { NAV_GROUPS, activeHref } from "./nav";
import styles from "./Shell.module.css";

export default function SideNav() {
  const active = activeHref(usePathname() ?? "/");

  return (
    <nav className={styles.side} aria-label='Pages'>
      {NAV_GROUPS.map((g) => (
        <div key={g.label}>
          <p className={styles.groupLabel}>{g.label}</p>
          <ul className={styles.group}>
            {g.items.map((i) => {
              const on = i.href === active;
              return (
                <li key={i.key}>
                  <Link
                    href={i.href}
                    className={`${styles.navLink} ${on ? styles.navLinkActive : ""}`}
                    aria-current={on ? "page" : undefined}
                  >
                    <span className={styles.navIcon}>{i.icon}</span>
                    {i.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <form action={logout} className={styles.actions}>
        <button type='submit' className={styles.actionBtn}>
          Sign out
        </button>
      </form>
    </nav>
  );
}
