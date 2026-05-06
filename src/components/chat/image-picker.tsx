"use client";

import { useRef } from "react";
import { resizeImage } from "@/lib/utils";

interface ImagePickerProps {
  onImages: (images: string[]) => void;
  maxImages?: number;
}

export default function ImagePicker({
  onImages,
  maxImages = 10,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, maxImages);
    if (files.length === 0) return;

    const resized = await Promise.all(
      files.map((f) => resizeImage(f, 800, 0.8))
    );
    onImages(resized);

    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
        id="image-picker"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
        title="Attach images"
      >
        📷
      </button>
    </>
  );
}
