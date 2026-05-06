import { NextRequest, NextResponse } from "next/server";
import { getRows, appendRow } from "@/lib/google-sheets";
import { generateId, nowISO, todayDate } from "@/lib/utils";
import type { WorkoutEntry } from "@/types";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayDate();
  try {
    const rows = await getRows<WorkoutEntry>("workouts", { date });
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: WorkoutEntry = {
      id: generateId(),
      timestamp: nowISO(),
      date: body.date || todayDate(),
      type: body.type || "",
      exercise: body.exercise || "",
      sets: body.sets || 0,
      reps: body.reps || "",
      weight_lbs: body.weight_lbs || "",
      notes: body.notes || "",
      source: body.source || "manual",
    };
    await appendRow("workouts", entry as unknown as Record<string, unknown>);
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
