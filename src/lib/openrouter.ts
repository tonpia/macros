import { OpenRouter } from "@openrouter/sdk";
import type { ChatMessages, ChatContentItems } from "@openrouter/sdk/models";
import { SYSTEM_PROMPT } from "./ai-prompts";
import type { AIResponse } from "@/types";

function getClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  return new OpenRouter({ apiKey });
}

function parseAIResponse(raw: string): AIResponse {
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(jsonStr) as AIResponse;
  } catch {
    return {
      message: raw,
      type: "general",
      data: null,
      confidence: "low",
    };
  }
}

/**
 * Stream AI response as SSE events.
 * Emits: { type: "reasoning", content } | { type: "content", content } | { type: "done", response: AIResponse }
 */
export async function* streamChatWithAI(
  userMessage: string,
  images?: string[],
): AsyncGenerator<{ type: "reasoning" | "content" | "done"; content?: string; response?: AIResponse }> {
  const openrouter = getClient();

  const contentParts: ChatContentItems[] = [];

  if (images && images.length > 0) {
    for (const img of images) {
      contentParts.push({
        type: "image_url",
        imageUrl: { url: img },
      });
    }
  }

  if (userMessage) {
    contentParts.push({ type: "text", text: userMessage });
  }

  const userContent: string | ChatContentItems[] =
    contentParts.length === 1 && contentParts[0].type === "text"
      ? userMessage
      : contentParts;

  const messages: ChatMessages[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  const stream = await openrouter.chat.send({
    chatRequest: {
      model: "moonshotai/kimi-k2.6",
      messages,
      stream: true,
      reasoning: { effort: "minimal" },
    },
  });

  let raw = "";
  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice?.delta) continue;

    // Check for reasoning content
    const delta = choice.delta as Record<string, unknown>;
    const reasoning = delta.reasoning as string | undefined;
    if (reasoning) {
      yield { type: "reasoning", content: reasoning };
      continue;
    }

    const c = delta.content as string | undefined;
    if (c) {
      raw += c;
      yield { type: "content", content: c };
    }
  }

  if (!raw) {
    throw new Error("No response from AI");
  }

  const response = parseAIResponse(raw);
  yield { type: "done", response };
}

/** Non-streaming version for backward compatibility */
export async function chatWithAI(
  userMessage: string,
  images?: string[],
): Promise<AIResponse> {
  let result: AIResponse | undefined;
  for await (const event of streamChatWithAI(userMessage, images)) {
    if (event.type === "done" && event.response) {
      result = event.response;
    }
  }
  if (!result) throw new Error("No response from AI");
  return result;
}
