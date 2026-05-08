"use client";

import { useState, useEffect, useCallback } from "react";
import type { FoodEntry, DailyGoals, FoodEstimation } from "@/types";
import { todayDate } from "@/lib/utils";
import ChatInterface from "@/components/chat/chat-interface";
import MacroRing from "@/components/macros/macro-ring";
import FoodLogList from "@/components/macros/food-log-list";
import GoalsEditor from "@/components/macros/goals-editor";

type Tab = "log" | "chat" | "goals";

export default function MacrosPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [foodRes, goalsRes] = await Promise.all([
        fetch(`/api/sheets/food-log?date=${todayDate()}`),
        fetch("/api/sheets/daily-goals"),
      ]);
      const foodData = await foodRes.json();
      const goalsData = await goalsRes.json();
      setEntries(Array.isArray(foodData) ? foodData : []);
      setGoals(goalsData);
    } catch (err) {
      console.error("Failed to fetch macro data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein_g: acc.protein_g + (e.protein_g || 0),
      carbs_g: acc.carbs_g + (e.carbs_g || 0),
      fat_g: acc.fat_g + (e.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  async function handleSaveFood(
    items: FoodEstimation[],
    source: "ai_image" | "ai_chat" | "ai_label"
  ) {
    for (const item of items) {
      await fetch("/api/sheets/food-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: item.description,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
          source,
        }),
      });
    }
    fetchData();
  }

  async function handleDeleteEntry(id: string) {
    await fetch(`/api/sheets/food-log/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleUpdateEntry(id: string, data: Partial<FoodEntry>) {
    await fetch(`/api/sheets/food-log/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchData();
  }

  async function handleSaveGoals(g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }) {
    if (goals?.id) {
      await fetch(`/api/sheets/daily-goals/${goals.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(g),
      });
    } else {
      await fetch("/api/sheets/daily-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(g),
      });
    }
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      {/* Macro rings */}
      <div className="flex justify-around">
        <MacroRing
          label="Cal"
          current={totals.calories}
          goal={goals?.calories || 0}
          color="#3b82f6"
        />
        <MacroRing
          label="Protein"
          current={totals.protein_g}
          goal={goals?.protein_g || 0}
          color="#ef4444"
          unit="g"
        />
        <MacroRing
          label="Carbs"
          current={totals.carbs_g}
          goal={goals?.carbs_g || 0}
          color="#f59e0b"
          unit="g"
        />
        <MacroRing
          label="Fat"
          current={totals.fat_g}
          goal={goals?.fat_g || 0}
          color="#22c55e"
          unit="g"
        />
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-800 p-1">
        {(["chat", "log", "goals"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t === "chat" ? "Chat" : t === "log" ? "Log" : "Goals"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "chat" && (
        <ChatInterface
          onSaveFood={handleSaveFood}
          placeholder="Describe what you ate or attach food photos..."
        />
      )}

      {tab === "log" && (
        <FoodLogList
          entries={entries}
          onDelete={handleDeleteEntry}
          onUpdate={handleUpdateEntry}
        />
      )}

      {tab === "goals" && (
        <GoalsEditor currentGoals={goals} onSave={handleSaveGoals} />
      )}
    </div>
  );
}
