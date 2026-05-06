"use client";

import { useState } from "react";
import { todayDate } from "@/lib/utils";

interface WeightFormProps {
  onSave: (weight: number, date: string, notes: string) => void;
}

export default function WeightForm({ onSave }: WeightFormProps) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayDate());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    onSave(Number(weight), date, notes);
    setWeight("");
    setNotes("");
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-800 bg-gray-900 p-4"
    >
      <h3 className="mb-3 text-sm font-medium text-gray-400">Log Weight</h3>
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight (lbs)"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
          />
        </div>
        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
          />
        </div>
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
      />
      <button
        type="submit"
        disabled={saving || !weight}
        className="mt-3 w-full rounded-lg bg-purple-600 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Weight"}
      </button>
    </form>
  );
}
