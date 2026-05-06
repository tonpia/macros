"use client";

import type { WorkoutEntry } from "@/types";

interface WorkoutLogListProps {
  entries: WorkoutEntry[];
  onDelete: (id: string) => void;
}

export default function WorkoutLogList({
  entries,
  onDelete,
}: WorkoutLogListProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No workouts logged today. Use the chat to log exercises.
      </p>
    );
  }

  // Group by muscle type
  const grouped = entries.reduce(
    (acc, entry) => {
      const type = entry.type || "Other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(entry);
      return acc;
    },
    {} as Record<string, WorkoutEntry[]>
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h4 className="mb-2 text-sm font-medium text-gray-400">{type}</h4>
          <div className="space-y-2">
            {items.map((entry) => (
              <div
                key={entry.id}
                className="group flex items-center justify-between rounded-lg bg-gray-800 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{entry.exercise}</p>
                  <p className="text-xs text-gray-400">
                    {entry.sets} sets × {entry.reps} reps
                    {entry.weight_lbs && ` @ ${entry.weight_lbs} lbs`}
                  </p>
                  {entry.notes && (
                    <p className="mt-1 text-xs text-gray-500">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-gray-700 hover:text-red-300 active:bg-gray-700"
                >
                  Del
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
