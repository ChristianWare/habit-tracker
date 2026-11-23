import type { MealKey } from "@/lib/nutrition";

export type FoodRow = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  addedSugar: number;
  fiber: number;
};

export type SavedMealRow = {
  id: string;
  name: string;
  meal: MealKey;
  calories: number;
  protein: number;
  items: string[];
};

export type EntryRow = {
  id: string;
  meal: MealKey;
  name: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fromSaved: boolean;
};
