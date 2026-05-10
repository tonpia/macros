// ─── Google Sheets row types ───

export interface WorkoutEntry {
  id: string;
  timestamp: string;
  date: string;
  type: string; // "Back", "Chest", "Legs", "Shoulders", "Arms", "Core"
  exercise: string;
  sets: number;
  reps: string; // comma-separated: "12,10,10,8"
  weight_lbs: string; // comma-separated: "120,130,130,140"
  notes: string;
  source: "manual" | "ai";
}

export interface FoodEntry {
  id: string;
  timestamp: string;
  date: string;
  meal: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: "ai_image" | "ai_chat" | "ai_label" | "manual";
  image_data: string;
}

export interface DailyGoals {
  id: string;
  timestamp: string;
  date_effective: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface BodyLogEntry {
  id: string;
  timestamp: string;
  date: string;
  weight_lbs: number;
  notes: string;
  photo_data: string;
}

// ─── AI response types ───

export interface FoodEstimation {
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
}

export interface WorkoutEstimation {
  type: string;
  exercise: string;
  sets: number;
  reps: string;
  weight_lbs: string;
}

export interface BodyEstimation {
  notes: string;
}

export interface AIResponse {
  message: string;
  type: "food" | "workout" | "body" | "nutrition_label" | "general";
  data: FoodEstimation[] | WorkoutEstimation[] | BodyEstimation | null;
  confidence: "low" | "medium" | "high";
}

// ─── Chat types ───

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[]; // base64 data URIs
  aiResponse?: AIResponse;
  timestamp: string;
  isStreaming?: boolean; // true while AI response is being streamed
  isReasoning?: boolean; // true while AI is in reasoning/thinking phase
}

// ─── UI types ───

export interface MacroSummary {
  calories: { current: number; goal: number };
  protein_g: { current: number; goal: number };
  carbs_g: { current: number; goal: number };
  fat_g: { current: number; goal: number };
}
