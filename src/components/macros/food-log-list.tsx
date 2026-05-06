"use client";

import type { FoodEntry } from "@/types";
import { useState } from "react";

interface FoodLogListProps {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<FoodEntry>) => void;
}

export default function FoodLogList({
  entries,
  onDelete,
  onUpdate,
}: FoodLogListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No food logged yet today. Use the chat above to log meals.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <FoodLogItem
          key={entry.id}
          entry={entry}
          isEditing={editingId === entry.id}
          onEdit={() => setEditingId(entry.id)}
          onCancel={() => setEditingId(null)}
          onDelete={() => onDelete(entry.id)}
          onUpdate={(data) => {
            onUpdate(entry.id, data);
            setEditingId(null);
          }}
        />
      ))}
    </div>
  );
}

function FoodLogItem({
  entry,
  isEditing,
  onEdit,
  onCancel,
  onDelete,
  onUpdate,
}: {
  entry: FoodEntry;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onUpdate: (data: Partial<FoodEntry>) => void;
}) {
  const [cal, setCal] = useState(entry.calories);
  const [protein, setProtein] = useState(entry.protein_g);
  const [carbs, setCarbs] = useState(entry.carbs_g);
  const [fat, setFat] = useState(entry.fat_g);

  if (isEditing) {
    return (
      <div className="rounded-lg border border-blue-600 bg-gray-800 p-3">
        <p className="mb-2 text-sm font-medium">{entry.description}</p>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-gray-400">Cal</label>
            <input
              type="number"
              value={cal}
              onChange={(e) => setCal(Number(e.target.value))}
              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Protein</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Carbs</label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(Number(e.target.value))}
              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Fat</label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(Number(e.target.value))}
              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() =>
              onUpdate({
                calories: cal,
                protein_g: protein,
                carbs_g: carbs,
                fat_g: fat,
              })
            }
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between rounded-lg bg-gray-800 p-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{entry.description}</p>
        <div className="mt-1 flex gap-3 text-xs text-gray-400">
          <span>{entry.calories} cal</span>
          <span>{entry.protein_g}g P</span>
          <span>{entry.carbs_g}g C</span>
          <span>{entry.fat_g}g F</span>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className="rounded px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-700 hover:text-white active:bg-gray-700"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-gray-700 hover:text-red-300 active:bg-gray-700"
        >
          Del
        </button>
      </div>
    </div>
  );
}
