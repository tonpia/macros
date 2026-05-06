import { OpenRouter } from "@openrouter/sdk";
import type {
  ChatMessages,
  ChatContentItems,
} from "@openrouter/sdk/models";
import { SYSTEM_PROMPT } from "./ai-prompts";
import type { AIResponse } from "@/types";

function getClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  return new OpenRouter({ apiKey });
}

export async function chatWithAI(
  userMessage: string,
  images?: string[],
): Promise<AIResponse> {
  const openrouter = getClient();

  // Build user content parts using SDK types (camelCase field names)
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

  // If only text, pass as plain string; otherwise pass content array
  const userContent: string | ChatContentItems[] =
    contentParts.length === 1 && contentParts[0].type === "text"
      ? userMessage
      : contentParts;

  const messages: ChatMessages[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  // Use streaming to collect the full response
  const stream = await openrouter.chat.send({
    chatRequest: {
      model: "moonshotai/kimi-k2.6",
      messages,
      stream: true,
    },
  });

  let raw = "";
  for await (const chunk of stream) {
    const c = chunk.choices[0]?.delta?.content;
    if (c) raw += c;
  }

  if (!raw) {
    throw new Error("No response from AI");
  }

  // Parse JSON from response, handling potential markdown code fences
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(jsonStr) as AIResponse;
  } catch {
    // If AI didn't return valid JSON, wrap it as a general response
    return {
      message: raw,
      type: "general",
      data: null,
      confidence: "low",
    };
  }
}
