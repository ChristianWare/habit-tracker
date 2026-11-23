// The app's pages. The side nav lists them all on desktop; at 1068px and
// below the bottom bar shows the first four and puts the rest under More.

import type { ReactNode } from "react";
import {
  AppleIcon,
  CalendarIcon,
  ChartIcon,
  CogIcon,
  ListIcon,
  RepeatIcon,
  SunIcon,
} from "@/components/icons";

export type NavItem = {
  key: string;
  title: string;
  short: string;
  href: string;
  icon: ReactNode;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Daily",
    items: [
      {
        key: "today",
        title: "Today",
        short: "Today",
        href: "/",
        icon: <SunIcon />,
      },
      {
        key: "calendar",
        title: "Calendar",
        short: "Calendar",
        href: "/calendar",
        icon: <CalendarIcon />,
      },
      {
        key: "food",
        title: "Food",
        short: "Food",
        href: "/food",
        icon: <AppleIcon />,
      },
      {
        key: "tasks",
        title: "Tasks",
        short: "Tasks",
        href: "/tasks",
        icon: <ListIcon />,
      },
    ],
  },
  {
    label: "Plan",
    items: [
      {
        key: "habits",
        title: "Habits",
        short: "Habits",
        href: "/habits",
        icon: <RepeatIcon />,
      },
      {
        key: "progress",
        title: "Progress",
        short: "Progress",
        href: "/progress",
        icon: <ChartIcon />,
      },
      {
        key: "settings",
        title: "Settings",
        short: "Settings",
        href: "/settings",
        icon: <CogIcon />,
      },
    ],
  },
];

export const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
export const TAB_KEYS = ["today", "calendar", "food", "tasks"];

/** The page to highlight: home matches only itself, others their subpages. */
export function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const { href } of ALL_ITEMS) {
    const hit =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(href + "/");
    if (hit && (!best || href.length > best.length)) best = href;
  }
  return best;
}
