# ViralFlow

**AI-powered social media content engine** — onboard a brand via conversational AI, auto-generate a 7-day content strategy, render Reels with AI scripts + voiceover + footage, review and approve them, auto-publish to Instagram on schedule, and close the loop with analytics-driven self-optimization.

Built for **AI Skills Fest by Microsoft** — **Agents League Hackathon**, **Creative Apps** track.

---

## What it does

ViralFlow is an end-to-end agentic pipeline that takes a brand from "tell us about your business" to a self-improving Instagram content machine:

1. **Brand Onboarding** — A conversational AI extracts a structured Brand Context Card (niche, audience, tone, voice, goals) through chat, with inline correction and contradiction detection.
2. **Strategy Engine** — Generates a 7-day content calendar (platform, post type, topic, angle, rationale) from the brand card. Editable, drag-and-drop, regenerate per-slot.
3. **Generate & Review** — For each approved slot, an AI writes a script, caption, hashtags and CTA, then renders a Reel (via MoneyPrinterTurbo) with AI voiceover and stock footage. Reels land in a review dashboard for approve / reject / regenerate.
4. **Scheduler & Publisher** — Approved Reels are auto-published to Instagram via the Graph API on a cron-driven scheduler, with retry/error handling for token expiry, rate limits, and container failures.
5. **Analytics & Optimization** — Pulls post performance (views, reach, saves, shares, skip rate), runs comment sentiment analysis, and feeds it to an Optimization Agent that rewrites the strategy rules — closing the loop back into the Strategy Engine for the next cycle.

```
Onboarding → Strategy → Generate & Review → Publisher → Analytics & Optimization
     ↑                                                              |
     └──────────────────── strategy rules updated ──────────────────┘
```

## Tech stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Radix UI, shadcn/ui, GSAP, Three.js / React Three Fiber for visual flair
- **Backend**: Node.js, Express, JWT (httpOnly cookie sessions), node-cron for the publisher worker
- **Database**: Postgres (Neon serverless), with a path to **Azure Database for PostgreSQL**
- **Storage**: **Azure Blob Storage** + **Azure CDN** for rendered video delivery
- **AI**: **Azure AI Foundry** / **Azure OpenAI Service** (conversational extraction, brand voice, strategy generation, script/caption generation, comment sentiment, optimization agent)
- **Video rendering**: [MoneyPrinterTurbo](./content-generator) for AI script-to-Reel rendering (script → TTS voiceover → stock footage → ffmpeg compose)
- **Social**: Instagram Graph API (Instagram Login flow) for OAuth, publishing, and insights

## Project structure

```
ViralFlow/
├── frontend/            # Next.js app (onboarding chat, strategy calendar, review dashboard, analytics)
├── backend/             # Express API + cron worker
│   └── src/
│       ├── features/
│       │   ├── auth/         # signup/login/session middleware
│       │   ├── onboarding/    # brand card chat + extraction
│       │   ├── strategy/      # 7-day calendar generation (Mode A / Mode B)
│       │   ├── videos/        # script gen, MPT render, review actions
│       │   ├── publisher/     # Instagram OAuth + scheduler worker
│       │   └── analytics/     # collection + optimization agent
│       └── db/                # migrations + Postgres client
├── content-generator/   # MoneyPrinterTurbo (Reel rendering engine)
└── SLICES.md             # full vertical-slice spec (source of truth)
```

## Running locally

### Prerequisites

- Node.js 18+
- Postgres database (e.g. [Neon](https://neon.tech) or **Azure Database for PostgreSQL**)
- **Azure AI Foundry** / **Azure OpenAI** API key + endpoint
- **Azure Blob Storage** account + container (for video storage) — or use local storage in dev
- Instagram app credentials (or run in mock mode, see below)

### Backend

```bash
cd backend
npm install
# create a .env with: DATABASE_URL, JWT_SECRET, AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT,
#                      AZURE_STORAGE_* (Blob), MOCK_INSTAGRAM=true, BACKEND_BASE_URL, etc.
npm run migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mock mode

Since real Instagram Business API access requires app review, set `MOCK_INSTAGRAM=true` to run the full publish → analytics → optimization loop end-to-end with simulated Instagram responses and a pre-loaded Week-1 mock analytics dataset. This lets the entire self-optimization cycle (Slice 5) be demoed without live IG access.

## Hackathon

This project was built for **[Agents League](https://developer.microsoft.com/en-us/reactor/series/s-1658/)**, the hackathon track of **Microsoft's AI Skills Fest 2026** (June 4–14, 2026) — submitted under the **Creative Apps** track, which challenges builders to create innovative applications using AI-assisted development to accelerate concept-to-code.

## Documentation

- [`SLICES.md`](./SLICES.md) — full vertical-slice build spec (UI / API / DB / AI integration per slice, plus implementation deviations)
- [`AI Social Media Content Generation & Management...md`](<./AI Social Media Content Generation & Management To 378a530d042a814bbf61edce0e615cd0.md>) — original product spec
