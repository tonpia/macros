"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { todayDate } from "@/lib/utils";
import type { FoodEntry, WorkoutEntry, DailyGoals, BodyLogEntry } from "@/types";
import MacroRing from "@/components/macros/macro-ring";

export default function DashboardPage() {
  const [food, setFood] = useState<FoodEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [latestWeight, setLatestWeight] = useState<BodyLogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [foodRes, workoutRes, goalsRes, bodyRes] = await Promise.all([
          fetch(`/api/sheets/food-log?date=${todayDate()}`),
          fetch(`/api/sheets/workouts?date=${todayDate()}`),
          fetch("/api/sheets/daily-goals"),
          fetch("/api/sheets/body-log"),
        ]);

        const foodData = await foodRes.json();
        const workoutData = await workoutRes.json();
        const goalsData = await goalsRes.json();
        const bodyData = await bodyRes.json();

        setFood(Array.isArray(foodData) ? foodData : []);
        setWorkouts(Array.isArray(workoutData) ? workoutData : []);
        setGoals(goalsData);

        if (Array.isArray(bodyData) && bodyData.length > 0) {
          const withWeight = bodyData.filter((e: BodyLogEntry) => e.weight_lbs > 0);
          if (withWeight.length > 0) {
            setLatestWeight(withWeight[withWeight.length - 1]);
          }
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const macroTotals = food.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein_g: acc.protein_g + (e.protein_g || 0),
      carbs_g: acc.carbs_g + (e.carbs_g || 0),
      fat_g: acc.fat_g + (e.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Today</h2>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Macro rings */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-400">Macros</h3>
        {goals ? (
          <div className="flex justify-around">
            <MacroRing
              label="Cal"
              current={macroTotals.calories}
              goal={goals.calories}
              color="#3b82f6"
            />
            <MacroRing
              label="Protein"
              current={macroTotals.protein_g}
              goal={goals.protein_g}
              color="#ef4444"
              unit="g"
            />
            <MacroRing
              label="Carbs"
              current={macroTotals.carbs_g}
              goal={goals.carbs_g}
              color="#f59e0b"
              unit="g"
            />
            <MacroRing
              label="Fat"
              current={macroTotals.fat_g}
              goal={goals.fat_g}
              color="#22c55e"
              unit="g"
            />
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500">
            Set your daily goals in the{" "}
            <Link href="/macros" className="text-blue-400 underline">
              Macros
            </Link>{" "}
            tab
          </p>
        )}
      </div>

      {/* Workouts */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-400">Workouts</h3>
        {workouts.length > 0 ? (
          <div>
            <p className="text-2xl font-bold">{workouts.length}</p>
            <p className="text-xs text-gray-400">exercises logged</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[...new Set(workouts.map((w) => w.type))].map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-300"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No workouts logged today</p>
        )}
      </div>

      {/* Weight */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-400">Weight</h3>
        {latestWeight ? (
          <div>
            <p className="text-2xl font-bold">
              {latestWeight.weight_lbs}{" "}
              <span className="text-sm font-normal text-gray-400">lbs</span>
            </p>
            <p className="text-xs text-gray-500">
              Recorded {latestWeight.date}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No weight recorded</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/macros"
          className="rounded-xl bg-blue-600/20 p-4 text-center text-sm text-blue-400 transition hover:bg-blue-600/30"
        >
          Log Food
        </Link>
        <Link
          href="/workouts"
          className="rounded-xl bg-green-600/20 p-4 text-center text-sm text-green-400 transition hover:bg-green-600/30"
        >
          Log Workout
        </Link>
        <Link
          href="/body"
          className="rounded-xl bg-purple-600/20 p-4 text-center text-sm text-purple-400 transition hover:bg-purple-600/30"
        >
          Log Weight
        </Link>
      </div>
    </div>
  );
}
