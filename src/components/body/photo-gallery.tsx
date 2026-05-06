"use client";

import type { BodyLogEntry } from "@/types";

interface PhotoGalleryProps {
  entries: BodyLogEntry[];
}

export default function PhotoGallery({ entries }: PhotoGalleryProps) {
  const withPhotos = entries.filter((e) => e.photo_data);

  if (withPhotos.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-400">
          Progress Photos
        </h3>
        <p className="text-center text-sm text-gray-500">
          No progress photos yet. Use the chat to upload body photos.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-400">
        Progress Photos
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {withPhotos.map((entry) => (
          <div key={entry.id} className="relative">
            <img
              src={entry.photo_data}
              alt={`Progress ${entry.date}`}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
              {entry.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
