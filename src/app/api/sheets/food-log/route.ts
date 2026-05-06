import { NextRequest, NextResponse } from "next/server";
import { getRows, appendRow } from "@/lib/google-sheets";
import { generateId, nowISO, todayDate } from "@/lib/utils";
import type { FoodEntry } from "@/types";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayDate();
  try {
    const rows = await getRows<FoodEntry>("food_log", { date });
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: FoodEntry = {
      id: generateId(),
      timestamp: nowISO(),
      date: body.date || todayDate(),
      meal: body.meal || "",
      description: body.description || "",
      calories: body.calories || 0,
      protein_g: body.protein_g || 0,
      carbs_g: body.carbs_g || 0,
      fat_g: body.fat_g || 0,
      source: body.source || "manual",
      image_data: body.image_data || "",
    };
    await appendRow("food_log", entry as unknown as Record<string, unknown>);
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
