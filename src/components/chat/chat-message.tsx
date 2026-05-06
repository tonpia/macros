"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType, AIResponse, FoodEstimation, WorkoutEstimation, BodyEstimation } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onSaveFood?: (items: FoodEstimation[]) => void;
  onSaveWorkout?: (items: WorkoutEstimation[]) => void;
  onSaveBody?: (data: BodyEstimation) => void;
}

export default function ChatMessage({
  message,
  onSaveFood,
  onSaveWorkout,
  onSaveBody,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const ai = message.aiResponse;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-100"
        }`}
      >
        {/* User images */}
        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`attachment ${i + 1}`}
                className="h-24 w-24 rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {/* Message text */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}

        {/* AI structured data */}
        {ai && ai.type !== "general" && ai.data && (
          <div className="mt-3 space-y-2">
            {ai.type === "food" || ai.type === "nutrition_label" ? (
              <FoodDataCard
                items={ai.data as FoodEstimation[]}
                confidence={ai.confidence}
                onSave={onSaveFood}
              />
            ) : ai.type === "workout" ? (
              <WorkoutDataCard
                items={ai.data as WorkoutEstimation[]}
                confidence={ai.confidence}
                onSave={onSaveWorkout}
              />
            ) : ai.type === "body" ? (
              <BodyDataCard
                data={ai.data as BodyEstimation}
                onSave={onSaveBody}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function FoodDataCard({
  items,
  confidence,
  onSave,
}: {
  items: FoodEstimation[];
  confidence: string;
  onSave?: (items: FoodEstimation[]) => void;
}) {
  const [saved, setSaved] = useState(false);
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein_g: acc.protein_g + item.protein_g,
      carbs_g: acc.carbs_g + item.carbs_g,
      fat_g: acc.fat_g + item.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">
          Estimated Macros
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            confidence === "high"
              ? "bg-green-900 text-green-300"
              : confidence === "medium"
                ? "bg-yellow-900 text-yellow-300"
                : "bg-red-900 text-red-300"
          }`}
        >
          {confidence}
        </span>
      </div>

      {items.map((item, i) => (
        <div key={i} className="border-b border-gray-800 py-2 last:border-0">
          <p className="text-sm font-medium">{item.description}</p>
          <div className="mt-1 flex gap-3 text-xs text-gray-400">
            <span>{item.calories} cal</span>
            <span>{item.protein_g}g P</span>
            <span>{item.carbs_g}g C</span>
            <span>{item.fat_g}g F</span>
          </div>
        </div>
      ))}

      {items.length > 1 && (
        <div className="mt-2 border-t border-gray-700 pt-2">
          <div className="flex gap-3 text-xs font-medium text-white">
            <span>Total: {totals.calories} cal</span>
            <span>{totals.protein_g}g P</span>
            <span>{totals.carbs_g}g C</span>
            <span>{totals.fat_g}g F</span>
          </div>
        </div>
      )}

      {onSave && !saved && (
        <button
          onClick={() => { onSave(items); setSaved(true); }}
          className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Save to Log
        </button>
      )}
      {saved && (
        <p className="mt-3 text-center text-sm font-medium text-green-400">
          Saved ✓
        </p>
      )}
    </div>
  );
}

function WorkoutDataCard({
  items,
  confidence,
  onSave,
}: {
  items: WorkoutEstimation[];
  confidence: string;
  onSave?: (items: WorkoutEstimation[]) => void;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">
          Parsed Workout
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            confidence === "high"
              ? "bg-green-900 text-green-300"
              : confidence === "medium"
                ? "bg-yellow-900 text-yellow-300"
                : "bg-red-900 text-red-300"
          }`}
        >
          {confidence}
        </span>
      </div>

      {items.map((item, i) => (
        <div key={i} className="border-b border-gray-800 py-2 last:border-0">
          <p className="text-sm font-medium">
            {item.exercise}{" "}
            <span className="text-xs text-gray-400">({item.type})</span>
          </p>
          <p className="text-xs text-gray-400">
            {item.sets} sets × {item.reps} reps @ {item.weight_lbs} lbs
          </p>
        </div>
      ))}

      {onSave && !saved && (
        <button
          onClick={() => { onSave(items); setSaved(true); }}
          className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Save Workout
        </button>
      )}
      {saved && (
        <p className="mt-3 text-center text-sm font-medium text-green-400">
          Saved ✓
        </p>
      )}
    </div>
  );
}

function BodyDataCard({
  data,
  onSave,
}: {
  data: BodyEstimation;
  onSave?: (data: BodyEstimation) => void;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-3">
      <span className="text-xs font-medium text-gray-400">
        Body Analysis
      </span>
      <p className="mt-1 text-sm">{data.notes}</p>
      {onSave && !saved && (
        <button
          onClick={() => { onSave(data); setSaved(true); }}
          className="mt-3 w-full rounded-lg bg-purple-600 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          Save Note
        </button>
      )}
      {saved && (
        <p className="mt-3 text-center text-sm font-medium text-green-400">
          Saved ✓
        </p>
      )}
    </div>
  );
}
