"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkoutEntry, WorkoutEstimation } from "@/types";
import { todayDate } from "@/lib/utils";
import ChatInterface from "@/components/chat/chat-interface";
import WorkoutLogList from "@/components/workouts/workout-log-list";

export default function WorkoutsPage() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/sheets/workouts?date=${todayDate()}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSaveWorkout(items: WorkoutEstimation[]) {
    for (const item of items) {
      await fetch("/api/sheets/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: item.type,
          exercise: item.exercise,
          sets: item.sets,
          reps: item.reps,
          weight_lbs: item.weight_lbs,
          source: "ai",
        }),
      });
    }
    fetchData();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/sheets/workouts/${id}`, { method: "DELETE" });
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      {/* Summary */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-gray-400">exercises today</p>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
          >
            {showChat ? "Hide Chat" : "Log Workout"}
          </button>
        </div>
      </div>

      {/* Chat */}
      {showChat && (
        <ChatInterface
          onSaveWorkout={handleSaveWorkout}
          placeholder="Describe your workout or attach gym photos..."
        />
      )}

      {/* Log */}
      <WorkoutLogList entries={entries} onDelete={handleDelete} />
    </div>
  );
}
