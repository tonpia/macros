"use client";

import { useState, useEffect, useCallback } from "react";
import type { BodyLogEntry, BodyEstimation } from "@/types";
import { resizeImage } from "@/lib/utils";
import ChatInterface from "@/components/chat/chat-interface";
import WeightForm from "@/components/body/weight-form";
import WeightChart from "@/components/body/weight-chart";
import PhotoGallery from "@/components/body/photo-gallery";

export default function BodyPage() {
  const [entries, setEntries] = useState<BodyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/sheets/body-log");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch body data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSaveWeight(weight: number, date: string, notes: string) {
    await fetch("/api/sheets/body-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_lbs: weight, date, notes }),
    });
    fetchData();
  }

  async function handleSaveBody(data: BodyEstimation) {
    // If body analysis came with photos from chat, save the note
    await fetch("/api/sheets/body-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: data.notes }),
    });
    fetchData();
  }

  // Handle photo upload separately (from file input on this page)
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await resizeImage(file, 400, 0.6);
    await fetch("/api/sheets/body-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_data: compressed, notes: "Progress photo" }),
    });
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <WeightForm onSave={handleSaveWeight} />
      <WeightChart entries={entries} />

      {/* Photo upload */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-400">
          Upload Progress Photo
        </h3>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-700 p-6 text-sm text-gray-400 transition hover:border-gray-600 hover:text-gray-300">
          <span>Tap to upload a photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>
      </div>

      <PhotoGallery entries={entries} />

      {/* AI Chat for body analysis */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-400">
          Body Analysis Chat
        </h3>
        <ChatInterface
          onSaveBody={handleSaveBody}
          placeholder="Send a body photo for AI analysis..."
          sessionKey="body"
        />
      </div>
    </div>
  );
}
