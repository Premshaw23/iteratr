# iteratr
**The Adaptive AI Coding Mentor**
> Pair-program with a senior engineer. Never just be told you're wrong.

---

## Setup Guide — Steps 1 to 3

Follow these steps in order. Do not skip ahead.

---

### Step 1 — Local environment

```bash
# Clone or unzip this project
cd iteratr

# Install dependencies
npm install

# Copy the env template
cp .env.example .env.local
```

---

### Step 2 — Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project called `iteratr`
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy **Client ID** and **Client Secret** into `.env.local`

---

### Step 3 — GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Homepage URL: `http://localhost:3000`
4. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy **Client ID** and **Client Secret** into `.env.local`

---

### Step 4 — Supabase database

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Wait for it to spin up (~2 minutes)
3. Go to **SQL Editor** and paste the entire contents of `supabase/schema.sql`
4. Click **Run** — all 6 tables and indexes are created
5. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 5 — NextAuth secret

```bash
# Generate a secure secret
openssl rand -base64 32
# Paste the output into NEXTAUTH_SECRET in .env.local
```

---

### Step 6 — Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the login page. Sign in with Google or GitHub. Check your Supabase dashboard — a new row should appear in the `users` table.

---

### Step 7 — Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add all env variables in Vercel dashboard → Settings → Environment Variables
# Change NEXTAUTH_URL to your Vercel URL e.g. https://iteratr.vercel.app
```

---

## Project structure

```
src/
├── app/
│   ├── (auth)/login/     ← Login page
│   ├── api/auth/         ← NextAuth API routes
│   ├── api/user/         ← User data API
│   ├── dashboard/        ← Protected dashboard
│   ├── layout.tsx        ← Root layout
│   └── providers.tsx     ← SessionProvider
├── lib/
│   ├── auth.ts           ← NextAuth config
│   └── supabase.ts       ← Supabase clients
├── types/
│   ├── database.ts       ← All DB types (6 tables)
│   └── next-auth.d.ts    ← Extended session types
supabase/
└── schema.sql            ← Run this in Supabase SQL editor
```

---

## What's built (Phase 1 — Core Engine)

### 🧩 Smart Question Engine
- [x] **Gemini-Flash-Lite Integration**: Generous free-tier AI generation of high-quality coding questions.
- [x] **Multi-Type Support**: 
  - **MCQ**: Conceptual questions with AI-generated misconception feedback.
  - **Fill in the Blank**: Tactical blanks targeting core logic gaps.
  - **Drag to Order**: Interactive sorting for procedural and algorithmic knowledge.
  - **Code Space**: High-performance side-by-side IDE for real-world challenges.
- [x] **Monaco Editor**: Professional-grade IDE integration (vs-dark theme, JetBrains Mono).

### 🎓 Socratic Mentorship
- [x] **4-Level Calibrated Hints**: Logical nudge → Directional nudge → Pseudocode → Full walkthrough.
- [x] **AI Logic Verification**: Deep analysis of code against hidden test cases and edge cases.
- [x] **Specific Feedback**: Explanations that tell you *why* you're wrong, not just that you are.

### 🧠 Analytics & Adaptation
- [x] **Adaptive Elo Rating**: Question difficulty automatically matches your current skill level.
- [x] **Topic Statistics**: Tracking "Weak Zones" across subtopics like Arrays, Graphs, and System Design.
- [x] **Session Configurator**: Full control over topics, styles (FAANG/Strict/Friendly), and language (Python, C++, JS).

---

## What's next (Phase 2 — Adaptive Mentorship)

- [ ] **Adaptive Memory**: AI remembers your specific conceptual gaps and adjusts sessions to bridge them.
- [ ] **Real-time Interviewer Sidebar**: A conversational mentor that reacts and chats as you type code.
- [ ] **Judge0 Integration**: Official native code execution across Python, C++, and JavaScript.
- [ ] **Gamification**: Visual leveling system, badges for mastering specific topics, and streak trackers.
