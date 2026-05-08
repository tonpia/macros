# Macros

A personal fitness and nutrition tracking app. Log food, workouts, and body progress using an AI chat interface. Data is stored in Google Sheets.

## Features

- **AI-powered logging** — describe food, upload photos of meals or nutrition labels, log workouts in natural language
- **Macro tracking** — daily calorie/protein/carbs/fat goals with visual ring display
- **Workout log** — track exercises by type, sets, reps, and weight
- **Body tracking** — weight history with chart, progress photos, and AI physique analysis
- **Dashboard** — daily summary of macros, workouts, and current weight
- **Google Sheets backend** — all data lives in your own spreadsheet

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **OpenRouter** (Kimi K2.6 model) for AI chat
- **Google Sheets API v4** for data storage
- Cookie-based authentication (HMAC-SHA256)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file:

```env
APP_PASSWORD=your-login-password
AUTH_SECRET=your-hmac-signing-secret

OPENROUTER_API_KEY=sk-or-...
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_BASE64=base64-encoded-service-account-json
```

**Google Sheets setup:**

1. Create a Google Sheet with tabs named: `food-log`, `workouts`, `body-log`, `daily-goals`
2. Create a Google Cloud service account with Sheets API access
3. Share the spreadsheet with the service account email
4. Base64-encode the service account JSON: `base64 -w 0 service-account.json`

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your `APP_PASSWORD`.

## Project Structure

```text
src/
├── app/
│   ├── (authenticated)/       # Protected pages (dashboard, macros, workouts, body)
│   ├── api/
│   │   ├── auth/login/        # POST — authenticate user
│   │   ├── ai/chat/           # POST — AI chat with streaming
│   │   └── sheets/            # CRUD routes for all data tables
│   └── login/                 # Login page
├── components/
│   ├── body/                  # Weight chart, photo gallery, weight form
│   ├── chat/                  # Chat interface, message display, image picker
│   ├── layout/                # Header, bottom nav
│   ├── macros/                # Food log list, macro ring, goals editor
│   └── workouts/              # Workout log list
├── lib/
│   ├── ai-prompts.ts          # System prompt and response parsing
│   ├── auth.ts                # Token creation and validation
│   ├── google-sheets.ts       # Generic Sheets CRUD helpers
│   ├── openrouter.ts          # OpenRouter API client
│   └── utils.ts               # Shared utilities
└── types/
    └── index.ts               # Shared TypeScript types
```

## AI Chat

The AI classifies each message into one of five types and returns structured JSON:

| Type              | Trigger                    | Output                                          |
| ----------------- | -------------------------- | ----------------------------------------------- |
| `food`            | Food photo or description  | Macro estimates (calories, protein, carbs, fat) |
| `nutrition_label` | Photo of a nutrition label | Exact macro values                              |
| `workout`         | Exercise description       | Structured workout entry                        |
| `body`            | Progress photo             | Physique analysis notes                         |
| `general`         | Anything else              | Plain text response                             |

## License

Personal use.
