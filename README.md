# iteratr

**AI-powered coding mentorship for adaptive practice, Socratic guidance, and interview-grade feedback.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](#)
[![Next.js](https://img.shields.io/badge/next.js-15.x-black)](#)

---

## 🚧 Status
iteratr is under active development. Core learning, evaluation, and interview flows are fully functional. This project features database-backed mock interviews and detailed post-interview evaluation replays.

## Key Features

- **Adaptive Elo Engine**: Dynamic difficulty mapping with streak tracking and performance history.
- **Socratic Hinting**: 4-level AI-guided hinting system that helps users solve problems themselves without giving away the answers.
- **Code Evaluation Pipeline**: Real-time code execution with Judge0 sandboxed environments and AI verification.
- **Mock Interview Dashboard**: A central control center showcasing technical domain statistics, mock interview KPI widgets, and complete past interview session history.
- **Dynamic Session Replays**: A comprehensive replay center displaying:
  * **Scorecard Overview**: Metrics for overall outcome (Hire/No Hire), along with scores for Code Quality, Logic, Speed, and Communication.
  * **Code Replay**: A read-only Monaco code view containing the candidate's final submitted code.
  * **Interactive Dialogue Timeline**: A speech-bubble chat history showing conversation, interspersed with inline **Silent Grader Observations** nested directly under the candidate's responses.
- **Logos / Social Proof**: Refined landing pages with responsive navigation, glassmorphic headers, and premium UI styling.

## System Architecture

iteratr consists of two main decoupled components:

1. **Next.js App** (`/src`)
   - Handles the client application, API routes, database integrations, and static rendering.
   - Leverages Supabase (PostgreSQL) for user metadata, practice history, and session scorecards.
   - Integrates with Gemini AI for adaptive question logic, hint generation, and silent grading rubrics.

2. **WebSocket Interview Server** (`/server`)
   - A Node/Socket.io server providing real-time bidirectional audio/chat streams for live mock interviews.
   - Delivers instant interviewer responses and emits silent grader checkpoints without blocking the UI.

The Next.js app communicates with the WebSocket server using `NEXT_PUBLIC_WS_URL`.

## Tech Stack

- **Core**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Vanilla CSS
- **Auth**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Google Gemini API
- **Execution Sandbox**: Judge0 API
- **Real-time Engine**: Socket.io
- **Rate Limiting**: Upstash Redis
- **Visualizations**: Recharts, Lucide Icons

## Setup & Installation

### Prerequisites
- Node.js 20+
- npm 9+
- A Supabase PostgreSQL database
- A Gemini API key

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Environment Setup
Configure environment variables:
```bash
cp .env.example .env.local
```
Update `.env.local` with your database credentials, NextAuth configuration, Gemini API key, and Judge0 endpoint.

### 3. Run Development Servers
Start the Next.js development server:
```bash
npm run dev
```

In a separate terminal, start the real-time WebSocket interview server:
```bash
# Navigate to the server folder and run
cd server
npm install
node index.js
```

---

## Code Quality Check
Before submitting PRs or deploying, verify that the project builds and complies with code standards:

```bash
# Typecheck check
npx tsc --noEmit

# Linter check
npm run lint
```
