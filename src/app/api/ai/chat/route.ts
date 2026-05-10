import { NextRequest } from "next/server";
import { streamChatWithAI } from "@/lib/openrouter";
import { getRows } from "@/lib/google-sheets";
import type { CommonFood } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { message, images } = await req.json();

    if (!message && (!images || images.length === 0)) {
      return Response.json(
        { error: "Message or images required" },
        { status: 400 }
      );
    }

    // Fetch common foods to inject into the AI prompt
    let commonFoods: CommonFood[] = [];
    try {
      commonFoods = await getRows<CommonFood>("common-foods");
    } catch {
      // Tab may not exist yet — proceed without common foods
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamChatWithAI(message || "", images, commonFoods)) {
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.close();
        } catch (e) {
          const errorEvent = JSON.stringify({ type: "error", content: String(e) });
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("AI chat error:", e);
    return Response.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
