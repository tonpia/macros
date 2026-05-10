# Project Context

This file provides context for AI assistants working on this codebase.

## What This Project Is

A personal fitness and nutrition tracker. The user logs food, workouts, and body progress through an AI chat interface. All data is stored in Google Sheets. There is a single user — authentication is a shared password, not multi-user accounts.

## Key Constraints

- **Next.js version is non-standard.** Read `node_modules/next/dist/docs/` before writing any Next.js code. Do not assume APIs match your training data.
- **Single user app.** No user IDs, no multi-tenancy. Auth is a simple password stored in `APP_PASSWORD` env var.
- **Google Sheets is the database.** There is no SQL DB. All reads/writes go through `src/lib/google-sheets.ts`.
- **AI via OpenRouter.** The model is Kimi K2.6 accessed through OpenRouter. Do not swap providers without being asked.

## Architecture

### Authentication

- `POST /api/auth/login` validates `APP_PASSWORD`, returns an HMAC-SHA256 signed token in a secure HTTP-only cookie
- `src/middleware.ts` protects all routes under `/(authenticated)/`
- Token helpers live in `src/lib/auth.ts`

### Data Layer

All data is in Google Sheets. The spreadsheet has five tabs:

| Tab name       | Contains              |
| -------------- | --------------------- |
| `food-log`     | Food entries          |
| `workouts`     | Workout entries       |
| `body-log`     | Weight + photo entries|
| `daily-goals`  | Macro targets         |
| `common-foods` | Pre-registered foods with exact macros |

Generic CRUD helpers in `src/lib/google-sheets.ts`:

- `getRows(tab, filter?)` — fetch rows, optional date filter
- `appendRow(tab, data)` — add a row
- `updateRow(tab, id, data)` — update a row by `id`
- `deleteRow(tab, id)` — delete a row by `id`
- `getLatestRow(tab)` — get the most recent row

### AI Layer

- `src/lib/openrouter.ts` — thin wrapper around the OpenRouter streaming API
- `src/lib/ai-prompts.ts` — system prompt + response parsing
- `POST /api/ai/chat` — receives `{ message, images? }`, streams AI response, returns parsed JSON
- AI reasoning is intentionally limited to reduce latency

The AI returns one of five response shapes based on intent classification:

```ts
// food or nutrition_label
{ type: "food" | "nutrition_label", meal: string, description: string,
  calories: number, protein_g: number, carbs_g: number, fat_g: number }

// workout
{ type: "workout", exercise: string, sets: number, reps: number,
  weight_lbs: number, notes: string }

// body
{ type: "body", notes: string }

// general
{ type: "general", message: string }
```

### Pages

| Route          | Component file                              | Purpose                          |
| -------------- | ------------------------------------------- | -------------------------------- |
| `/dashboard`   | `src/app/(authenticated)/dashboard/page.tsx`| Daily summary                    |
| `/macros`      | `src/app/(authenticated)/macros/page.tsx`   | Food log + AI chat + goals       |
| `/workouts`    | `src/app/(authenticated)/workouts/page.tsx` | Workout log + AI chat            |
| `/body`        | `src/app/(authenticated)/body/page.tsx`     | Weight chart + photos + analysis |
| `/login`       | `src/app/login/page.tsx`                    | Login form                       |

## Data Types

Defined in `src/types/index.ts`.

```ts
interface FoodEntry {
  id: string; timestamp: string; date: string; meal: string;
  description: string; calories: number; protein_g: number;
  carbs_g: number; fat_g: number;
  source: "ai_image" | "ai_chat" | "ai_label" | "manual";
  image_data?: string; // base64
}

interface WorkoutEntry {
  id: string; timestamp: string; date: string;
  type: string; exercise: string;
  sets: number; reps: number; weight_lbs: number; notes: string;
  source: "manual" | "ai";
}

interface BodyLogEntry {
  id: string; timestamp: string; date: string;
  weight_lbs: number; notes: string;
  photo_data?: string; // base64
}

interface DailyGoals {
  id: string; timestamp: string; date_effective: string;
  calories: number; protein_g: number; carbs_g: number; fat_g: number;
}

interface CommonFood {
  id: string; name: string; serving_size: string;
  calories: number; protein_g: number; carbs_g: number; fat_g: number;
}
```

## Environment Variables

| Variable                       | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `APP_PASSWORD`                 | Login password (default: `"admin"`)                      |
| `AUTH_SECRET`                  | HMAC signing key (default: `"dev-secret-change-me"`)     |
| `OPENROUTER_API_KEY`           | OpenRouter API key                                       |
| `GOOGLE_SPREADSHEET_ID`        | Google Sheets document ID                                |
| `GOOGLE_SERVICE_ACCOUNT_BASE64`| Base64-encoded service account JSON                      |

## Conventions

- **IDs** are generated with `nanoid` (see `src/lib/utils.ts`)
- **Dates** are stored as `YYYY-MM-DD` strings; timestamps as ISO 8601
- **Images** are compressed client-side to 400px max width, 0.6 quality before sending
- **Styling** is Tailwind CSS v4, dark theme (gray-950/900 base), mobile-first
- **API routes** follow REST conventions: `GET` to list, `POST` to create, `PUT /[id]` to update, `DELETE /[id]` to delete
- New rows always get an `id` (nanoid) and `timestamp` (ISO string) assigned server-side before appending to Sheets
