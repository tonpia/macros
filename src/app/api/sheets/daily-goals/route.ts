import { NextRequest, NextResponse } from "next/server";
import { getLatestRow, appendRow } from "@/lib/google-sheets";
import { generateId, nowISO, todayDate } from "@/lib/utils";
import type { DailyGoals } from "@/types";

export async function GET() {
  try {
    const goals = await getLatestRow<DailyGoals>("daily-goals");
    return NextResponse.json(goals || null);
  } catch (e) {
    console.error("daily-goals GET error:", e);
    // Return null instead of 500 when tab is empty or doesn't exist yet
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: DailyGoals = {
      id: generateId(),
      timestamp: nowISO(),
      date_effective: body.date_effective || todayDate(),
      calories: body.calories || 0,
      protein_g: body.protein_g || 0,
      carbs_g: body.carbs_g || 0,
      fat_g: body.fat_g || 0,
    };
    await appendRow("daily-goals", entry as unknown as Record<string, unknown>);
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
