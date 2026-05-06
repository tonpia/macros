"use client";

import { useState, useRef, useEffect } from "react";
import { generateId, nowISO } from "@/lib/utils";
import type {
  ChatMessage as ChatMessageType,
  AIResponse,
  FoodEstimation,
  WorkoutEstimation,
  BodyEstimation,
} from "@/types";
import ChatMessage from "./chat-message";
import ImagePicker from "./image-picker";

interface ChatInterfaceProps {
  onSaveFood?: (items: FoodEstimation[], source: "ai_image" | "ai_chat" | "ai_label") => void;
  onSaveWorkout?: (items: WorkoutEstimation[]) => void;
  onSaveBody?: (data: BodyEstimation) => void;
  placeholder?: string;
}

export default function ChatInterface({
  onSaveFood,
  onSaveWorkout,
  onSaveBody,
  placeholder = "Describe your food, workout, or attach photos...",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() && pendingImages.length === 0) return;

    const userMsg: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
      timestamp: nowISO(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          images: userMsg.images,
        }),
      });

      if (!res.ok) throw new Error("AI request failed");

      const aiResponse: AIResponse = await res.json();

      const assistantMsg: ChatMessageType = {
        id: generateId(),
        role: "assistant",
        content: aiResponse.message,
        aiResponse,
        timestamp: nowISO(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessageType = {
        id: generateId(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}. Please try again.`,
        timestamp: nowISO(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveFood(items: FoodEstimation[], aiResponse?: AIResponse) {
    const source =
      aiResponse?.type === "nutrition_label"
        ? "ai_label" as const
        : pendingImages.length > 0 || messages.some((m) => m.images?.length)
          ? "ai_image" as const
          : "ai_chat" as const;
    onSaveFood?.(items, source);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-800 bg-gray-900">
      {/* Messages area */}
      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Send a message or photo to get started
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSaveFood={
              onSaveFood
                ? (items) => handleSaveFood(items, msg.aiResponse)
                : undefined
            }
            onSaveWorkout={onSaveWorkout}
            onSaveBody={onSaveBody}
          />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-800 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 border-t border-gray-800 px-4 py-2">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={img}
                alt={`pending ${i + 1}`}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <button
                onClick={() =>
                  setPendingImages((prev) => prev.filter((_, j) => j !== i))
                }
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 border-t border-gray-800 p-3">
        <ImagePicker
          onImages={(imgs) =>
            setPendingImages((prev) => [...prev, ...imgs].slice(0, 10))
          }
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={loading || (!input.trim() && pendingImages.length === 0)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
