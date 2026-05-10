import { OpenRouter } from "@openrouter/sdk";
import type { ChatMessages, ChatContentItems } from "@openrouter/sdk/models";
import { buildSystemPrompt } from "./ai-prompts";
import type { AIResponse, CommonFood } from "@/types";

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
  commonFoods?: CommonFood[],
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

  const systemPrompt = buildSystemPrompt(commonFoods ?? []);

  const messages: ChatMessages[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  const stream = await openrouter.chat.send({
    chatRequest: {
      model: "moonshotai/kimi-k2.6",
      messages,
      stream: true,
      reasoning: { effort: "medium" },
    },
  });

  let raw = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    // Check for reasoning content (thinking phase)
    if (delta.reasoning) {
      yield { type: "reasoning", content: delta.reasoning };
    }

    // Regular content
    if (delta.content) {
      raw += delta.content;
      yield { type: "content", content: delta.content };
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
  commonFoods?: CommonFood[],
): Promise<AIResponse> {
  let result: AIResponse | undefined;
  for await (const event of streamChatWithAI(userMessage, images, commonFoods)) {
    if (event.type === "done" && event.response) {
      result = event.response;
    }
  }
  if (!result) throw new Error("No response from AI");
  return result;
}
