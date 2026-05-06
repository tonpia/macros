import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { message, images, history } = await req.json();

    if (!message && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: "Message or images required" },
        { status: 400 }
      );
    }

    const result = await chatWithAI(message || "", images);
    return NextResponse.json(result);
  } catch (e) {
    console.error("AI chat error:", e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
