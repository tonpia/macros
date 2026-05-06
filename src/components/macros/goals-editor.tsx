"use client";

import { useState } from "react";
import type { DailyGoals } from "@/types";

interface GoalsEditorProps {
  currentGoals: DailyGoals | null;
  onSave: (goals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }) => void;
}

export default function GoalsEditor({ currentGoals, onSave }: GoalsEditorProps) {
  const [calories, setCalories] = useState(currentGoals?.calories || 2000);
  const [protein, setProtein] = useState(currentGoals?.protein_g || 150);
  const [carbs, setCarbs] = useState(currentGoals?.carbs_g || 200);
  const [fat, setFat] = useState(currentGoals?.fat_g || 65);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    onSave({ calories, protein_g: protein, carbs_g: carbs, fat_g: fat });
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-400">Daily Goals</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400">Calories</label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Protein (g)</label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Carbs (g)</label>
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Fat (g)</label>
          <input
            type="number"
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Update Goals"}
      </button>
    </div>
  );
}
