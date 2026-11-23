import Link from "next/link";
import PageIntro from "@/components/PageIntro/PageIntro";
import FoodLogger from "@/components/Food/FoodLogger";
import FoodDay from "@/components/Food/FoodDay";
import FoodManager from "@/components/Food/FoodManager";
import Meter from "@/components/ui/Meter";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { FoodRow, SavedMealRow } from "@/components/Food/types";
import { db } from "@/lib/db";
import { getGoals } from "@/lib/data";
import { addDays, isYmd, relativeDay, today } from "@/lib/dates";
import { meatWeek } from "@/lib/habits";
import { addedSugarLimit, fiberGoal, num, sumTotals } from "@/lib/nutrition";
import styles from "@/components/Food/Food.module.css";

export const metadata = { title: "Food" };

export default async function FoodPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d: q } = await searchParams;
  const t = today();
  const d = q && isYmd(q) && q <= t ? q : t;

  const [entries, foods, meals, goals, week] = await Promise.all([
    db.foodEntry.findMany({
      where: { date: d },
      orderBy: { createdAt: "asc" },
    }),
    db.food.findMany({ orderBy: { name: "asc" } }),
    db.savedMeal.findMany({
      orderBy: { name: "asc" },
      include: { items: { include: { food: true } } },
    }),
    getGoals(),
    db.foodEntry.groupBy({
      by: ["date"],
      where: { date: { gte: addDays(d, -6), lte: d } },
      _sum: { calories: true, protein: true },
    }),
  ]);

  const totals = sumTotals(entries);
  const foodRows: FoodRow[] = foods.map((f) => ({
    id: f.id,
    name: f.name,
    serving: f.serving,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    sugar: f.sugar,
    addedSugar: f.addedSugar,
    fiber: f.fiber,
  }));
  const mealRows: SavedMealRow[] = meals.map((m) => ({
    id: m.id,
    name: m.name,
    meal: m.meal,
    calories: m.items.reduce((n, i) => n + i.food.calories * i.servings, 0),
    protein: m.items.reduce((n, i) => n + i.food.protein * i.servings, 0),
    items: m.items.map((i) => i.food.name),
  }));

  const loggedDays = week.length;
  const avgCals = loggedDays
    ? week.reduce((n, w) => n + (w._sum.calories ?? 0), 0) / loggedDays
    : null;
  const left = goals.calories - totals.calories;
  const mw = goals.meatRotation ? meatWeek(d) : null;

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow={relativeDay(d, t)}
        heading='Food'
        copy={
          <>
            Aim for about {goals.calories.toLocaleString()} calories and{" "}
            {goals.protein} g of protein a day
            {goals.proteinIsAuto && goals.weight
              ? ` (${goals.proteinPerLb} g per lb of your ${goals.weight.value} lbs)`
              : ""}
            .{mw ? ` Meat rotation: ${mw.label.toLowerCase()}.` : ""}
          </>
        }
        kpis={[
          {
            label: left >= 0 ? "Calories left" : "Over by",
            value: Math.abs(Math.round(left)).toLocaleString(),
            accent: left <= 0,
          },
          {
            label: "Protein",
            value: `${num(totals.protein, 0)} g`,
            sub: `of ${goals.protein} g`,
          },
          {
            label: "Fiber",
            value: `${num(totals.fiber, 0)} g`,
            sub: `aim for ${fiberGoal(goals.calories)} g`,
          },
          {
            label: "7-day average",
            value: avgCals ? Math.round(avgCals).toLocaleString() : "—",
            sub: loggedDays
              ? `${loggedDays} day${loggedDays === 1 ? "" : "s"} logged`
              : "Nothing logged",
          },
        ]}
      />

      <div className={styles.dayNav}>
        <Link
          href={`/food?d=${addDays(d, -1)}`}
          className='secondaryBtn'
          aria-label='Previous day'
        >
          <ChevronLeft width={18} height={18} />
        </Link>
        <strong>{relativeDay(d, t)}</strong>
        {d < t ? (
          <Link
            href={`/food?d=${addDays(d, 1)}`}
            className='secondaryBtn'
            aria-label='Next day'
          >
            <ChevronRight width={18} height={18} />
          </Link>
        ) : null}
        {d !== t ? (
          <Link href='/food' className='secondaryBtn'>
            Today
          </Link>
        ) : null}
      </div>

      <div className={styles.columns}>
        <div className={styles.stack}>
          <FoodLogger date={d} foods={foodRows} meals={mealRows} />
          <FoodManager foods={foodRows} meals={mealRows} />
        </div>
        <div className={styles.stack}>
          <section className='panel'>
            <h2 className='cardTitle'>Totals</h2>
            <Meter
              label='Calories'
              value={totals.calories}
              goal={goals.calories}
              gold
            />
            <Meter
              label='Protein'
              value={totals.protein}
              goal={goals.protein}
              unit=' g'
            />
            <Meter
              label='Fiber'
              value={totals.fiber}
              goal={fiberGoal(goals.calories)}
              unit=' g'
            />
            <Meter
              label='Added sugar (limit)'
              value={totals.addedSugar}
              goal={addedSugarLimit(goals.calories)}
              unit=' g'
              limit
            />
            <p className='miniNote'>
              Carbs {num(totals.carbs, 0)} g · Fat {num(totals.fat, 0)} g ·
              Total sugar {num(totals.sugar, 0)} g (fruit and milk sugar
              included)
            </p>
          </section>
          <FoodDay
            date={d}
            entries={entries.map((e) => ({
              id: e.id,
              meal: e.meal,
              name: e.name,
              servings: e.servings,
              calories: e.calories,
              protein: e.protein,
              carbs: e.carbs,
              fat: e.fat,
              fromSaved: e.foodId != null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
