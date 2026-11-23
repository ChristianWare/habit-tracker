// npm run db:seed
//
// Fills an empty database with your categories, habits, goals and a
// starter food list. It does nothing if categories already exist, so it
// never overwrites your edits. Everything here can be changed in the app.

import "dotenv/config";
import {
  PrismaClient,
  type HabitKind,
  type ScheduleType,
} from "@prisma/client";

const db = new PrismaClient();
const TZ = process.env.APP_TIMEZONE || "America/Phoenix";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

/** The later of today and a planned start date. */
const startOn = (d: string) => (d > today ? d : today);

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const MON_FRI = [1, 2, 3, 4, 5];
const MON_THU = [1, 2, 3, 4];

const CATEGORIES = [
  { key: "congregation", name: "Congregation", color: "#3a4560" },
  { key: "health", name: "Health", color: "#0b7547" },
  { key: "house", name: "House", color: "#b86e00" },
  { key: "recreation", name: "Recreation", color: "#6b2633" },
  { key: "work", name: "Work", color: "#2563eb" },
] as const;

type Key = (typeof CATEGORIES)[number]["key"];

type SeedHabit = {
  name: string;
  category: Key;
  also?: Key[];
  kind?: HabitKind;
  unit?: string;
  target?: number;
  schedule?: ScheduleType;
  days?: number[];
  timesPerWeek?: number;
  dayNotes?: Record<string, string>;
  group?: string;
  meatRule?: boolean;
  start?: string;
  notes?: string;
};

const HABITS: SeedHabit[] = [
  // Morning routine: one block at the top of Today.
  { name: "Make your bed", category: "house", group: "Morning routine" },
  { name: "Push-ups", category: "health", group: "Morning routine" },
  { name: "Stretches", category: "health", group: "Morning routine" },
  { name: "Vitamins", category: "health", group: "Morning routine" },
  {
    name: "Sea moss with your shake",
    category: "health",
    group: "Morning routine",
  },

  // Congregation
  { name: "Bible reading", category: "congregation" },
  {
    name: "Field service",
    category: "congregation",
    schedule: "WEEKLY_COUNT",
    timesPerWeek: 3,
  },
  {
    name: "Personal study",
    category: "congregation",
    schedule: "WEEKLY_COUNT",
    timesPerWeek: 1,
  },
  {
    name: "Family worship",
    category: "congregation",
    also: ["recreation"],
    schedule: "WEEKLY_COUNT",
    timesPerWeek: 1,
  },

  // Health
  { name: "Workout", category: "health", days: MON_THU },
  {
    name: "Weight",
    category: "health",
    kind: "NUMBER",
    unit: "lbs",
    notes: "Weigh in first thing, before breakfast.",
  },
  { name: "Finish the gallon jug", category: "health" },
  { name: "Sleep 8 hours", category: "health" },
  {
    name: "Track calories",
    category: "health",
    kind: "FOOD_LOG",
    notes: "Checks itself off when you log food on the Food page.",
  },
  { name: "No sugar", category: "health", start: startOn("2026-11-30") },
  {
    name: "Meatless",
    category: "health",
    meatRule: true,
    start: startOn("2026-11-30"),
    notes:
      "One planned meat meal a week: red meat, then fish, then chicken; the last week of the month is meatless.",
  },
  {
    name: "No coffee or energy drinks",
    category: "health",
    days: MON_FRI,
    start: startOn("2026-12-07"),
  },

  // House
  {
    name: "Clean one area",
    category: "house",
    days: MON_FRI,
    dayNotes: {
      "1": "Kitchen",
      "2": "Bathrooms",
      "3": "Living room",
      "4": "Bedroom",
      "5": "Laundry and floors",
    },
  },

  // Recreation
  { name: "Date night", category: "recreation", days: [2] },
  {
    name: "Saturday evening",
    category: "recreation",
    days: [6],
    notes: "Friends, family, or just the two of you.",
  },

  // Work
  {
    name: "Outbound calls for new clients",
    category: "work",
    kind: "NUMBER",
    unit: "calls",
    target: 25,
    days: MON_FRI,
  },
];

// Per serving, rounded from USDA figures. Brands differ: check your labels.
const FOODS = [
  {
    name: "Egg",
    serving: "1 large",
    calories: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 4.8,
    sugar: 0.2,
  },
  {
    name: "Greek yogurt, plain nonfat",
    serving: "170 g cup",
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0.7,
    sugar: 5.5,
  },
  {
    name: "Cottage cheese, 2%",
    serving: "½ cup",
    calories: 92,
    protein: 11.8,
    carbs: 5.4,
    fat: 2.6,
    sugar: 4.5,
  },
  {
    name: "Milk, 2%",
    serving: "1 cup",
    calories: 122,
    protein: 8.1,
    carbs: 11.7,
    fat: 4.8,
    sugar: 12.3,
  },
  {
    name: "Cheddar cheese",
    serving: "1 oz",
    calories: 114,
    protein: 6.5,
    carbs: 0.7,
    fat: 9.4,
    sugar: 0.1,
  },
  {
    name: "Rolled oats",
    serving: "½ cup dry",
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 2.5,
    sugar: 1,
    fiber: 4,
  },
  {
    name: "Peanut butter",
    serving: "2 tbsp",
    calories: 190,
    protein: 7,
    carbs: 7,
    fat: 16,
    sugar: 3,
    addedSugar: 2,
    fiber: 2,
  },
  {
    name: "Banana",
    serving: "1 medium",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    sugar: 14.4,
    fiber: 3.1,
  },
  {
    name: "Mixed berries, frozen",
    serving: "1 cup",
    calories: 70,
    protein: 1,
    carbs: 17,
    fat: 0.5,
    sugar: 10,
    fiber: 4,
  },
  {
    name: "Protein powder",
    serving: "1 scoop",
    calories: 120,
    protein: 24,
    carbs: 3,
    fat: 1.5,
    sugar: 1,
  },
  {
    name: "Sea moss gel",
    serving: "2 tbsp",
    calories: 10,
    protein: 0.3,
    carbs: 2.5,
    fat: 0,
    sugar: 0,
    fiber: 0.5,
  },
  {
    name: "Lentils, cooked",
    serving: "1 cup",
    calories: 230,
    protein: 17.9,
    carbs: 39.9,
    fat: 0.8,
    sugar: 3.6,
    fiber: 15.6,
  },
  {
    name: "Black beans, cooked",
    serving: "1 cup",
    calories: 227,
    protein: 15.2,
    carbs: 40.8,
    fat: 0.9,
    sugar: 0.6,
    fiber: 15,
  },
  {
    name: "Chickpeas, cooked",
    serving: "1 cup",
    calories: 269,
    protein: 14.5,
    carbs: 45,
    fat: 4.2,
    sugar: 7.9,
    fiber: 12.5,
  },
  {
    name: "Tofu, firm",
    serving: "½ cup",
    calories: 181,
    protein: 21.8,
    carbs: 3.5,
    fat: 11,
    sugar: 0.6,
    fiber: 2.9,
  },
  {
    name: "Tempeh",
    serving: "3 oz",
    calories: 161,
    protein: 17,
    carbs: 6.4,
    fat: 9.1,
    sugar: 0,
  },
  {
    name: "Edamame, shelled",
    serving: "1 cup",
    calories: 188,
    protein: 18.4,
    carbs: 13.8,
    fat: 8.1,
    sugar: 3.4,
    fiber: 8.1,
  },
  {
    name: "Almonds",
    serving: "1 oz",
    calories: 164,
    protein: 6,
    carbs: 6.1,
    fat: 14.2,
    sugar: 1.2,
    fiber: 3.5,
  },
  {
    name: "Avocado",
    serving: "½ avocado",
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    sugar: 0.7,
    fiber: 6.7,
  },
  {
    name: "Olive oil",
    serving: "1 tbsp",
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    sugar: 0,
  },
  {
    name: "Brown rice, cooked",
    serving: "1 cup",
    calories: 248,
    protein: 5.5,
    carbs: 51.7,
    fat: 2,
    sugar: 0.5,
    fiber: 3.2,
  },
  {
    name: "Whole wheat bread",
    serving: "1 slice",
    calories: 81,
    protein: 3.9,
    carbs: 13.7,
    fat: 1.1,
    sugar: 1.4,
    addedSugar: 1,
    fiber: 1.9,
  },
  {
    name: "Sweet potato, baked",
    serving: "1 medium",
    calories: 103,
    protein: 2.3,
    carbs: 23.6,
    fat: 0.2,
    sugar: 7.4,
    fiber: 3.8,
  },
  {
    name: "Salmon, cooked",
    serving: "4 oz",
    calories: 233,
    protein: 25,
    carbs: 0,
    fat: 14,
    sugar: 0,
  },
  {
    name: "Chicken breast, cooked",
    serving: "4 oz",
    calories: 186,
    protein: 35,
    carbs: 0,
    fat: 4.1,
    sugar: 0,
  },
  {
    name: "Ground beef 90/10, cooked",
    serving: "4 oz",
    calories: 245,
    protein: 29.5,
    carbs: 0,
    fat: 13.2,
    sugar: 0,
  },
];

const SHAKE = [
  ["Milk, 2%", 1],
  ["Rolled oats", 1],
  ["Peanut butter", 1],
  ["Banana", 1],
  ["Protein powder", 1],
  ["Sea moss gel", 1],
] as const;

async function main() {
  if ((await db.category.count()) > 0) {
    console.log("Already set up: categories exist, so nothing was changed.");
    return;
  }

  await db.settings.upsert({
    where: { id: "app" },
    create: { id: "app", calorieGoal: 3000 },
    update: {},
  });

  const ids = {} as Record<Key, string>;
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await db.category.create({
      data: { name: c.name, color: c.color, sortOrder: i },
    });
    ids[c.key] = row.id;
  }

  for (const [i, h] of HABITS.entries()) {
    await db.habit.create({
      data: {
        name: h.name,
        notes: h.notes ?? null,
        kind: h.kind ?? "CHECK",
        unit: h.unit ?? null,
        target: h.target ?? null,
        schedule: h.schedule ?? "DAYS",
        daysOfWeek: h.days ?? EVERY_DAY,
        timesPerWeek: h.timesPerWeek ?? null,
        dayNotes: h.dayNotes ?? undefined,
        group: h.group ?? null,
        meatRule: h.meatRule ?? false,
        startDate: h.start ?? today,
        sortOrder: i,
        categoryId: ids[h.category],
        categories: h.also
          ? { connect: h.also.map((k) => ({ id: ids[k] })) }
          : undefined,
      },
    });
  }

  const foodIds = new Map<string, string>();
  for (const f of FOODS) {
    const row = await db.food.create({ data: f });
    foodIds.set(f.name, row.id);
  }

  await db.savedMeal.create({
    data: {
      name: "Sea moss shake",
      meal: "BREAKFAST",
      items: {
        create: SHAKE.map(([name, servings]) => ({
          foodId: foodIds.get(name)!,
          servings,
        })),
      },
    },
  });

  console.log(
    `Set up ${CATEGORIES.length} categories, ${HABITS.length} habits and ${FOODS.length} foods.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
