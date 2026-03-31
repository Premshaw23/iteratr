# iteratr — The Elite Adaptive AI Coding Mentor

> **Pair-program with a Senior Engineer AI. Get Socratic hints, live code evaluation, mock interviews, and ELO-rated performance analytics — all in one platform.**

[![CI](https://github.com/Premshaw23/iteratr/actions/workflows/ci.yml/badge.svg)](https://github.com/Premshaw23/iteratr/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Production Deployment](#production-deployment)
  - [System 1 — Next.js App (Vercel)](#system-1--nextjs-app-vercel)
  - [System 2 — WebSocket Server (VPS / Cloud VM)](#system-2--websocket-server-vps--cloud-vm)
- [CI/CD Pipeline](#cicd-pipeline)
- [Supabase Schema](#supabase-schema)
- [Project Structure](#project-structure)
- [Key Design Decisions](#key-design-decisions)

---

## Overview

**iteratr** is a full-stack adaptive learning platform that uses Google Gemini AI to generate ELO-rated coding questions across four types (MCQ, Fill-in-Blank, Drag-to-Order, Code), evaluate answers with a Socratic hint engine, and conduct live AI mock interviews with a real-time WebSocket server.

Users progress through a **streak + ELO rating system** — every answer updates their rating which feeds back into question difficulty selection, creating a true adaptive learning loop.

---

## Architecture

iteratr is composed of **two independent deployable systems**:

```
┌─────────────────────────────────────────────────────────┐
│  System 1: Next.js App (Vercel / any Node host)         │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │  Pages   │  │ API Routes │  │  NextAuth + JWT  │    │
│  │  (App    │  │ (/api/*)   │  │  (Google/GitHub) │    │
│  │  Router) │  │            │  └──────────────────┘    │
│  └──────────┘  └─────┬──────┘                          │
│                       │                                  │
│          ┌────────────┼───────────────┐                 │
│          ▼            ▼               ▼                 │
│       Supabase     Gemini AI       Stripe               │
│       (Postgres +  (multi-key)     (checkout +          │
│        pgvector)                    webhooks)            │
│          │            │                                  │
│       Upstash      Judge0                               │
│       Redis        (code exec)                          │
│       (rate limit)                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  System 2: WebSocket Server (Node.js / VPS)             │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │  server/index.js — Socket.io                 │       │
│  │  • Real-time mock interview chat             │       │
│  │  • AI interviewer (Gemini direct call)       │       │
│  │  • Silent background grader                  │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

The Next.js app and the WebSocket server are **fully decoupled** — the Next.js app connects to the WS server via `NEXT_PUBLIC_WS_URL`. They can (and should) be deployed independently.

---

## Features

| Feature | Description |
|---------|-------------|
| 🧠 **Adaptive ELO Engine** | Every question has an ELO rating. Each answer updates the user's ELO, which drives the next question's difficulty. |
| 📝 **4 Question Types** | MCQ • Fill-in-Blank • Drag-to-Order • Code Space |
| 💡 **Agentic Hint Engine** | ReAct-loop Socratic hints — 4 levels, progressively revealing the concept without giving the answer. |
| 🎤 **AI Mock Interview** | Live pair-programming session with a Gemini-powered AI interviewer over WebSocket. |
| 🔇 **Silent Grader** | Background agent that scores communication, logic, and optimization for every interview message. |
| 📊 **RAG Knowledge Base** | pgvector-powered knowledge search to give the AI interviewer domain-specific context. |
| 🔥 **Streak Tracking** | Daily streak system with IST timezone support and a streak-freeze mechanic. |
| 🏆 **Leaderboard** | Global ELO leaderboard with top 12 ranked users. |
| 👤 **Public Profiles** | Shareable user profiles at `/u/[username]` with ELO history, topic stats, and weak-zone analysis. |
| 💳 **Stripe Pro Upgrade** | Seamless Stripe Checkout → polled verify → instant Pro upgrade. |
| 🛡️ **Rate Limiting** | Upstash Redis (preferred) or Supabase DB fallback — 150/day free, 1000/day Pro. |
| 🔑 **Multi-Key Gemini Rotation** | Up to N API keys auto-rotate on 429 / 401 responses — no downtime under high traffic. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 |
| **Auth** | NextAuth v4 (Google + GitHub OAuth) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **AI** | Google Gemini (`gemini-flash-lite-latest`) |
| **Code Execution** | Judge0 CE (self-hosted or RapidAPI) |
| **Real-time** | Socket.io v4 (standalone Node server) |
| **Payments** | Stripe Checkout (one-time) |
| **Rate Limiting** | Upstash Redis (`@upstash/ratelimit`) |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Code Editor** | Monaco Editor |
| **Markdown** | react-markdown + remark-gfm + remark-math + rehype-katex |

---

## Prerequisites

- **Node.js** ≥ 20 (LTS)
- **npm** ≥ 9
- A **Supabase** project (free tier works)
- A **Google Cloud** project with OAuth credentials
- A **GitHub OAuth App**
- A **Google AI Studio** API key (Gemini)
- A **Stripe** account (test mode is fine for development)
- *(Optional)* An **Upstash** Redis database for rate limiting
- *(Optional)* A **Judge0** endpoint for real code execution

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/Premshaw23/iteratr.git
cd iteratr
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in **every** value. See the [Environment Variables Reference](#environment-variables-reference) below for a full guide.

### 4. Set up the Supabase database

Apply the schema (see [Supabase Schema](#supabase-schema)) to your project.

### 5. Set up NextAuth

- **Google OAuth**: [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0
  - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- **GitHub OAuth**: [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App
  - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 6. Run both servers (development)

Open **two terminals**:

**Terminal 1 — Next.js app:**
```bash
npm run dev
# → http://localhost:3000
```

**Terminal 2 — WebSocket server:**
```bash
node server/index.js
# → ws://localhost:3001
```

> The Next.js app reads `NEXT_PUBLIC_WS_URL` to know where to connect. Ensure it matches Terminal 2.

---

## Environment Variables Reference

All variables are in `.env.local` (never commit this file — it is already in `.gitignore`).

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | ✅ | Random 32-byte secret. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | Full app URL. Dev: `http://localhost:3000`. Prod: `https://yourdomain.com` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App client secret |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only, never expose to client) |
| `GEMINI_API_KEY` | ✅ | One or more Gemini API keys, comma-separated for auto-rotation |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (`sk_test_...` for development) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key (`pk_test_...` for development) |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket server URL. Dev: `http://localhost:3001`. Prod: `https://ws.yourdomain.com` |
| `WS_PORT` | ✅ | Port for `server/index.js`. Default: `3001` |
| `UPSTASH_REDIS_REST_URL` | ⚠️ Recommended | Upstash Redis REST URL for fast rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ Recommended | Upstash Redis REST token |
| `JUDGE0_API_URL` | ⚠️ Recommended | Judge0 endpoint. Default: `https://ce.judge0.com` |
| `JUDGE0_API_KEY` | ⚠️ Recommended | Judge0 API key (RapidAPI). Falls back to AI-only eval if missing |
| `RAG_ADMIN_KEY` | Optional | Admin key to protect `/api/knowledge/inject`. Generate: `openssl rand -base64 32` |

> **Pro tip (Gemini keys):** The platform auto-rotates keys on 429/401. You can pass up to 10+ keys comma-separated with **no spaces**: `KEY1,KEY2,KEY3`

---

## Production Deployment

### System 1 — Next.js App (Vercel)

Vercel is the recommended host — zero-config Next.js 15 support.

**Steps:**

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
3. In **Environment Variables**, add **all** variables from the reference above, using production values:
   - `NEXTAUTH_URL` → `https://yourdomain.com`
   - `NEXT_PUBLIC_WS_URL` → `https://ws.yourdomain.com` (your WS server address)
   - Stripe keys → production (`sk_live_...`, `pk_live_...`)
   - Supabase keys → production project
4. Update your OAuth providers' authorized redirect URIs to the production URL.
5. Deploy. Vercel handles builds, previews, and CDN automatically.

**Alternative (self-hosted Node server):**

```bash
# On your server:
npm ci
npm run build
npm start          # Runs Next.js on port 3000
```

Use Nginx as a reverse proxy to expose port 3000 to the web.

---

### System 2 — WebSocket Server (VPS / Cloud VM)

The WebSocket server (`server/index.js`) is a standalone Node.js process that **must** run separately from the Next.js app.

**Recommended hosts:** DigitalOcean Droplet, AWS EC2, Railway, Render (background worker), Fly.io.

#### Setup on a Linux VPS

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone the repository
git clone https://github.com/Premshaw23/iteratr.git
cd iteratr
npm ci --omit=dev

# 3. Create the env file (only the WS server needs these)
cp .env.example .env.local
# Fill in: GEMINI_API_KEY, NEXTAUTH_URL (for CORS), WS_PORT
nano .env.local

# 4. Run with PM2 (process manager — auto-restarts on crash)
npm install -g pm2
pm2 start server/index.js --name iteratr-ws
pm2 save
pm2 startup     # Follow the printed command to enable auto-start on reboot

# 5. Confirm it is running:
pm2 status
pm2 logs iteratr-ws
```

**The WS server only needs these env variables:**

```
GEMINI_API_KEY=...       # For AI responses
NEXTAUTH_URL=...         # Used for CORS (must be your Next.js app URL)
WS_PORT=3001             # Or any open port
```

#### Nginx reverse proxy for WebSocket (optional but recommended for HTTPS)

```nginx
server {
    listen 443 ssl;
    server_name ws.yourdomain.com;

    # SSL config here (use certbot / Let's Encrypt)

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

After this, set `NEXT_PUBLIC_WS_URL=https://ws.yourdomain.com` in your Vercel environment.

---

## CI/CD Pipeline

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push to `main` or `develop` and on all pull requests targeting `main`.

It runs **two parallel jobs**:

| Job | What it does |
|-----|-------------|
| `nextjs-build` | `npm ci` → ESLint → TypeScript type-check (`tsc --noEmit`) → `next build` |
| `ws-server-check` | `npm ci` → Node.js syntax check of `server/index.js` |

**Adding secrets to GitHub:**

For the build job to succeed in CI, add placeholder-level GitHub Actions secrets (the CI uses static placeholders, so actual secrets are NOT needed in CI — they are only needed in your production environment).

If you want to run end-to-end checks in CI:
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, etc. as Repository secrets
3. Reference them in the workflow using `${{ secrets.MY_SECRET }}`

---

## Supabase Schema

Your Supabase project needs the following tables. Run this SQL in the Supabase SQL editor:

```sql
-- Enable pgvector for RAG
create extension if not exists vector;

-- Users table
create table users (
  id            text primary key,
  email         text unique not null,
  display_name  text,
  avatar_url    text,
  preferred_language text default 'python',
  elo_rating    integer default 1200,
  streak_count  integer default 0,
  longest_streak integer default 0,
  is_pro        boolean default false,
  is_public     boolean default true,
  streak_freeze_available boolean default false,
  last_freeze_used_at timestamptz,
  reflection_text text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Questions table
create table questions (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null check (type in ('mcq','fill','order','code')),
  topic               text not null,
  subtopic            text,
  difficulty_elo      integer default 1200,
  problem_statement   text not null,
  payload             jsonb not null,
  hints               text[] default '{}',
  explanation         text,
  tags                text[] default '{}',
  is_daily_challenge  boolean default false,
  created_at          timestamptz default now()
);

-- Attempts table
create table attempts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text references users(id) on delete cascade,
  question_id         uuid references questions(id) on delete cascade,
  submitted_answer    text,
  is_correct          boolean default false,
  hints_used          integer default 0,
  time_taken_seconds  integer default 0,
  elo_before          integer,
  elo_after           integer,
  elo_change          integer,
  created_at          timestamptz default now()
);

-- ELO History table  
create table elo_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references users(id) on delete cascade,
  elo_before  integer,
  elo_after   integer,
  elo_change  integer,
  reason      text,
  question_id uuid references questions(id),
  created_at  timestamptz default now()
);

-- Topic stats table (per-user, per-subtopic)
create table topic_stats (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text references users(id) on delete cascade,
  topic               text not null,
  subtopic            text not null,
  fail_count          integer default 0,
  solved_count        integer default 0,
  consecutive_correct integer default 0,
  is_weak_zone        boolean default false,
  updated_at          timestamptz default now(),
  unique (user_id, subtopic)
);

-- Knowledge base for RAG (pgvector)
create table knowledge_base (
  id        uuid primary key default gen_random_uuid(),
  content   text not null,
  metadata  jsonb default '{}',
  embedding vector(768),  -- text-embedding-004 dimensions
  created_at timestamptz default now()
);

-- pgvector similarity search function
create or replace function match_knowledge(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (id uuid, content text, metadata jsonb, similarity float)
language sql stable
as $$
  select
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;

-- Indexes for performance
create index on attempts (user_id, created_at desc);
create index on elo_history (user_id, created_at desc);
create index on topic_stats (user_id);
create index on questions (topic, type, difficulty_elo);
create index on knowledge_base using ivfflat (embedding vector_cosine_ops);
```

---

## Project Structure

```
iteratr/
├── server/
│   └── index.js              # System 2: Standalone WebSocket server (Socket.io)
│
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login page (NextAuth)
│   │   ├── api/
│   │   │   ├── attempt/      # POST — Submit answer + ELO update
│   │   │   ├── checkpoint/   # Session verification
│   │   │   ├── code/         # Code execution endpoint
│   │   │   ├── checkout/
│   │   │   │   ├── session/  # POST — Create Stripe Checkout Session
│   │   │   │   └── verify/   # GET — Poll Stripe for payment status
│   │   │   ├── dashboard/
│   │   │   │   └── history/  # GET — ELO history for chart
│   │   │   ├── hint/         # POST — Agentic hint (ReAct loop)
│   │   │   ├── interview/
│   │   │   │   └── chat/     # POST — AI interviewer + silent grader
│   │   │   ├── knowledge/    # POST — RAG document injection
│   │   │   ├── leaderboard/  # GET — Top 12 by ELO
│   │   │   ├── questions/
│   │   │   │   └── generate/ # POST — Adaptive question generation
│   │   │   ├── u/[username]/ # GET — Public profile data
│   │   │   ├── user/
│   │   │   │   ├── activity/ # GET — Activity grid (1 year)
│   │   │   │   ├── me/       # GET — Current user profile
│   │   │   │   ├── reset-reflection/
│   │   │   │   └── stats/    # GET — Topic stats
│   │   │   └── auth/[...nextauth]/ # NextAuth handler
│   │   ├── dashboard/        # Main training dashboard
│   │   ├── interview/        # AI mock interview page
│   │   ├── leaderboard/      # Leaderboard page
│   │   ├── session/          # Active training session
│   │   ├── stats/            # Personal stats page
│   │   ├── subscribe/        # Pro upgrade + success page
│   │   └── u/[username]/     # Public profile page
│   │
│   ├── components/           # Shared React components
│   │
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config + Supabase user provisioning
│   │   ├── date-utils.ts     # IST timezone helpers
│   │   ├── elo.ts            # ELO calculation engine
│   │   ├── gemini.ts         # Full Gemini client (generation, hints, interview, grading)
│   │   ├── judge0.ts         # Judge0 code execution client
│   │   ├── mentor.ts         # Adaptive mentor context builder
│   │   ├── ratelimit.ts      # Upstash Redis / Supabase rate limiter
│   │   ├── schemas.ts        # Zod validation schemas for AI output
│   │   ├── stripe.ts         # Stripe client singleton
│   │   ├── supabase.ts       # Supabase browser + admin clients
│   │   └── vector.ts         # pgvector embedding + knowledge search
│   │
│   └── types/
│       └── database.ts       # Supabase table TypeScript types
│
├── .env.example              # Template — copy to .env.local
├── .env.local                # Your secrets — never commit!
├── .github/
│   └── workflows/
│       └── ci.yml            # CI: lint + type-check + build + WS syntax check
├── next.config.js            # Next.js config (image domains)
├── package.json
└── tsconfig.json
```

---

## Key Design Decisions

### Why two separate servers?
Next.js on Vercel (or any serverless host) cannot maintain long-lived WebSocket connections — each serverless function is stateless and short-lived. The real-time AI interview requires a persistent Socket.io connection, so it lives in a dedicated Node.js process.

### Why multi-key Gemini rotation?
The free Gemini tier has per-key rate limits. By providing multiple keys comma-separated in `GEMINI_API_KEY`, the platform transparently rotates on 429/401 errors, giving zero-downtime AI responses under bursts of traffic.

### Why Upstash Redis for rate limiting?
Supabase DB-based counting works but is slow (requires a table scan over `attempts`). Upstash Redis provides sub-millisecond fixed-window counting with analytics. If `UPSTASH_REDIS_REST_URL` is not set, the system gracefully falls back to Supabase counting.

### Why polling instead of webhooks for Stripe?
Webhooks require a publicly accessible endpoint — difficult in local development and adds complexity in production (CSRF, signing verification). The platform uses `/api/checkout/verify` polling from the success page for instant UX. By directly polling the Stripe Checkout Session endpoint, we verify payments instantly without needing a background webhook server.

### ELO system
Each question has a `difficulty_elo`. After every answer, the user's ELO is recalculated using a modified K-factor that penalizes hint usage and rewards speed. This drives the next question's target ELO, creating a true adaptive difficulty loop.
