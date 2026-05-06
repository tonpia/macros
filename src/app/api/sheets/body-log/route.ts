import { NextRequest, NextResponse } from "next/server";
import { getRows, appendRow } from "@/lib/google-sheets";
import { generateId, nowISO, todayDate } from "@/lib/utils";
import type { BodyLogEntry } from "@/types";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  try {
    const rows = await getRows<BodyLogEntry>(
      "body_log",
      date ? { date } : undefined
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: BodyLogEntry = {
      id: generateId(),
      timestamp: nowISO(),
      date: body.date || todayDate(),
      weight_lbs: body.weight_lbs || 0,
      notes: body.notes || "",
      photo_data: body.photo_data || "",
    };
    await appendRow("body_log", entry as unknown as Record<string, unknown>);
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
