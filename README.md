# iteratr

**AI-powered coding mentorship for adaptive practice, Socratic guidance, and interview-grade feedback.**

## 🚧 Work in Progress
iteratr is under active development. Core learning, evaluation, and interview flows exist, but the product is not feature-complete and APIs/UX may change. Expect breaking changes as the platform hardens toward production.

## Key Features
- **Adaptive ELO engine** with streak tracking and performance history.
- **AI-generated questions** (MCQ, fill-in-the-blank, ordering, and code) tuned to user difficulty.
- **Socratic hinting + AI feedback** for explanations and remediation.
- **Code evaluation pipeline** with Judge0 execution and AI verification.
- **Real-time mock interviews** via a dedicated WebSocket AI interviewer and silent grading.
- **Dashboards, leaderboard, and public profiles** (early-stage analytics).
- **Stripe checkout upgrade flow** for Pro tier (early-stage).
- **Rate limiting & quotas** with Upstash or database fallback.

## System Architecture
iteratr is split into two deployable services:

1. **Next.js App**
   - UI, API routes, and session management
   - Question generation, grading, ELO updates, and analytics
   - Integrations: Supabase, Gemini, Judge0, Stripe, Upstash

2. **WebSocket Interview Server**
   - Low-latency interview chat and AI interviewer responses
   - Background grading signals for interview feedback

## Tech Stack
- **Frontend/Server**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Auth**: NextAuth (Google/GitHub OAuth)
- **Data**: Supabase (PostgreSQL + pgvector)
- **AI**: Google Gemini
- **Code Execution**: Judge0
- **Real-time**: Socket.io
- **Payments**: Stripe Checkout
- **Rate Limiting**: Upstash Redis
- **Validation/Charts**: Zod, Recharts

## How it works
1. **User signs in** and starts a practice or interview session.
2. **Question selection** targets a difficulty band using the user’s ELO.
3. **AI generation** creates MCQ/fill/order/code tasks when cache misses.
4. **User submits** an answer or code; the platform executes and evaluates it.
5. **Feedback + ELO updates** are recorded along with streak and topic stats.
6. **Interview mode** streams messages to the WebSocket server for live AI responses.

## Roadmap
- Hardened production deployment (observability, retries, queueing)
- Advanced interview rubrics and structured scoring
- Curated question bank with human-reviewed difficulty calibration
- Team/coach dashboards and cohort analytics
- Expanded language support and richer code execution sandboxing

## Setup & Installation
**Prerequisites**: Node.js 20+, npm 9+, Supabase project, Gemini API key, Stripe account (optional), Upstash Redis (optional), Judge0 endpoint (optional).

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` values, then run both services:

```bash
# Next.js app
npm run dev

# WebSocket interview server
node server/index.js
```

## Contribution Guidelines
- Open an issue for major changes or new features.
- Keep PRs focused and well-scoped.
- Run `npm run lint` and `npm run build` before submitting.

## License
All rights reserved. No license is granted until a license file is published.
