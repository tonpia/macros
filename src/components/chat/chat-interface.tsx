"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  sessionKey?: string; // unique key for localStorage persistence
}

function getStorageKey(sessionKey: string) {
  return `chat_session_${sessionKey}`;
}

function loadMessages(sessionKey: string): ChatMessageType[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(getStorageKey(sessionKey));
    if (!stored) return [];
    const messages = JSON.parse(stored) as ChatMessageType[];
    // Clear any stale streaming state from previous session
    return messages.map((m) => ({ ...m, isStreaming: false, isReasoning: false }));
  } catch {
    return [];
  }
}

function saveMessages(sessionKey: string, messages: ChatMessageType[]) {
  if (typeof window === "undefined") return;
  try {
    const toStore = messages.map((m) => ({
      ...m,
      isStreaming: false,
      isReasoning: false,
    }));
    localStorage.setItem(getStorageKey(sessionKey), JSON.stringify(toStore));
  } catch {
    // localStorage full — try again without images
    try {
      const toStore = messages.map((m) => ({
        ...m,
        images: undefined,
        isStreaming: false,
        isReasoning: false,
      }));
      localStorage.setItem(getStorageKey(sessionKey), JSON.stringify(toStore));
    } catch {
      // Still failing — silently ignore
    }
  }
}

export default function ChatInterface({
  onSaveFood,
  onSaveWorkout,
  onSaveBody,
  placeholder = "Describe your food, workout, or attach photos...",
  sessionKey = "default",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [reasoningText, setReasoningText] = useState("");
  const [isReasoning, setIsReasoning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (!initialized.current) {
      const stored = loadMessages(sessionKey);
      if (stored.length > 0) {
        setMessages(stored);
      }
      // Mark initialized after a tick so the save effect skips the load-triggered update
      requestAnimationFrame(() => {
        initialized.current = true;
      });
    }
  }, [sessionKey]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (!initialized.current) return;
    if (messages.length > 0) {
      saveMessages(sessionKey, messages);
    }
  }, [messages, sessionKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    setReasoningText("");
    setIsReasoning(false);
    localStorage.removeItem(getStorageKey(sessionKey));
  }, [sessionKey]);

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
    setStreamingText("");
    setReasoningText("");
    setIsReasoning(false);

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

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";
      let finalResponse: AIResponse | undefined;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newlines)
        const parts = buffer.split("\n\n");
        // Keep the last part in the buffer (may be incomplete)
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          const event = JSON.parse(jsonStr);

          if (event.type === "reasoning") {
            setIsReasoning(true);
            setReasoningText((prev) => prev + (event.content || ""));
          } else if (event.type === "content") {
            setIsReasoning(false);
            accumulated += event.content;
            setStreamingText(accumulated);
          } else if (event.type === "done") {
            finalResponse = event.response;
          } else if (event.type === "error") {
            throw new Error(event.content);
          }
        }
      }

      if (finalResponse) {
        const assistantMsg: ChatMessageType = {
          id: generateId(),
          role: "assistant",
          content: finalResponse.message,
          aiResponse: finalResponse,
          timestamp: nowISO(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Fallback: use accumulated text as message
        const assistantMsg: ChatMessageType = {
          id: generateId(),
          role: "assistant",
          content: accumulated || "No response received.",
          timestamp: nowISO(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
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
      setStreamingText("");
      setReasoningText("");
      setIsReasoning(false);
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
      {/* Header with New Chat button */}
      {messages.length > 0 && (
        <div className="flex items-center justify-end border-b border-gray-800 px-4 py-2">
          <button
            onClick={handleNewChat}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
          >
            New Chat
          </button>
        </div>
      )}

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

        {/* Streaming / reasoning indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl bg-gray-800 px-4 py-3">
              {isReasoning ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-500 border-t-blue-400" />
                    <span className="text-xs font-medium text-blue-400">Thinking...</span>
                  </div>
                  {reasoningText && (
                    <p className="text-xs whitespace-pre-wrap text-gray-500 italic max-h-32 overflow-y-auto">
                      {reasoningText}
                    </p>
                  )}
                </div>
              ) : streamingText ? (
                <p className="text-sm whitespace-pre-wrap text-gray-100">{streamingText}</p>
              ) : (
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0.2s]" />
                </div>
              )}
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
