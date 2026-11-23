# Habit Tracker

A private, one-person app for daily habits, tasks, food and mood, in the
look of silver-state-demo. Next.js 16, Prisma 6 (Postgres), Auth.js.

## Pages

- **Today**: what's due, grouped as Morning routine and then by category,
  each with its category tags, the day's focus ("Today: Kitchen"), weekly
  counts and streaks. Tasks due, a food summary, habits starting soon, and
  the mood check last.
- **Calendar**: a month with every fully finished day crossed off, a
  done/due count on the others and a mood stripe. Filter by category
  (1–5) or a single habit. Tap a past day to fix its check-offs.
- **Food**: log saved foods, new foods from a label (saved for next time)
  or saved meals in one tap. Totals against your calorie, protein, fiber
  and added-sugar goals.
- **Tasks**: one-time and repeating (daily → yearly) tasks; anything with
  no date sits in your inbox.
- **Habits**: add, edit, reorder, archive (history kept) or delete.
- **Progress**: week, month, quarter or year; mood against habits done,
  by category, by habit, weight trend and food averages.
- **Settings**: goals, the meat rotation, categories, password.

## Set up (once)

1. Make a free Postgres database (for example at neon.tech) and copy its
   connection string.
2. `cp .env.example .env` and fill in `DATABASE_URL` and `AUTH_SECRET`
   (make one with `npx auth secret`).
3. Create the tables, fill in your habits, and make your login:

   ```bash
   npm install
   npm run db:push
   npm run db:seed
   npm run set-password
   npm run dev
   ```

There is no sign-up page. `npm run set-password` is the only way to make
or change the login, and it replaces any other.

## Deploy (Vercel)

Import the repo and add the same `DATABASE_URL`, `AUTH_SECRET` and
`APP_TIMEZONE` as environment variables. Then on your iPhone, open the
site in Safari → Share → Add to Home Screen.
