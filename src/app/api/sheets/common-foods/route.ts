import { NextRequest, NextResponse } from "next/server";
import { getRows, appendRow } from "@/lib/google-sheets";
import { generateId, nowISO } from "@/lib/utils";
import type { CommonFood } from "@/types";

const TAB = "common-foods";

export async function GET() {
  try {
    const rows = await getRows<CommonFood>(TAB);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("common-foods GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: CommonFood = {
      id: generateId(),
      name: body.name,
      calories: body.calories || 0,
      protein_g: body.protein_g || 0,
      carbs_g: body.carbs_g || 0,
      fat_g: body.fat_g || 0,
      serving_size: body.serving_size || "",
    };
    await appendRow(TAB, entry as unknown as Record<string, unknown>);
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
