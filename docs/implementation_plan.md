# Iteratr Development Plan & Status Analysis

This document provides a gap analysis between the **Product Plan (v1.0)** and the **current implementation**, followed by a prioritized roadmap to reach full functionality.

## 📊 Current Implementation Status
Based on the analysis of the `src` directory and `package.json`:

| Feature | Phase (PDF) | Status | Details |
| :--- | :---: | :---: | :--- |
| **Auth & Profiles** | 1 | ✅ Done | Supabase & NextAuth integration verified. |
| **Session Configurator** | 2 | ✅ Done | UI is complete with Topic, Difficulty, and Mode selection. |
| **MCQ Engine** | 1 | ✅ Done | Fully functional in `/session/play` with feedback and scoring. |
| **Socratic Hint System** | 1/2 | ⚠️ Partial | UI supports 4-level hints; logic resides in `/api/hint`. |
| **Elo Rating System** | 2 | ⚠️ Partial | UI shows Elo changes; backend calculation needs verification. |
| **Fill in the Blank** | 1 | ❌ Missing | Question rendering logic only supports MCQ payload. |
| **Code Space (Monaco)** | 1 | ❌ Missing | Editor not integrated; `monaco-editor` missing from dependencies. |
| **Code Execution (Judge0)** | 1 | ❌ Missing | No backend service for sandboxed execution found. |
| **Drag to Order** | 1 | ❌ Missing | Component not implemented. |
| **Knowledge Gap Detector**| 2 | ❌ Missing | Needs automated topic-stats tracking and logic. |
| **Mock Interview Suite** | 3 | ❌ Missing | Requires WebSocket setup and Multi-Agent logic. |
| **Analytics & Heatmap** | 4 | ❌ Missing | Dashboard needs Activity Grid and topic-mastery radar. |

---

## 🚀 Recommendation: Phase-wise Roadmap

### Phase 1: Completing the Core Testing Engine (Weeks 4-5)
*Current Focus: Transitioning from a Quiz app to a Coding Mentor.*

1.  **Integrate Monaco Editor**: Add `@monaco-editor/react` to `package.json` and implement the `CodeSpace` component in `/session/play`.
2.  **Judge0 Integration**: Set up the backend bridge to Judge0 API (or Piston) for secure code execution.
3.  **Multi-interface Support**: Update the Question Engine to dynamically render `MCQ`, `FillInBlank`, `CodeSpace`, and `DragToOrder` based on the API response.
4.  **Backend Schema Alignment**: Ensure Supabase tables (`attempts`, `topic_stats`) match the PDF schema for accurate tracking.

### Phase 2: Adaptive Intelligence & Polish (Weeks 6-8)
*Goal: Making the platform feel smart and personalized.*

1.  **Elo Logic Refinement**: Implement the exact matchmaking formulas from Section 4.1 in the backend.
2.  **Knowledge Gap UI**: Build the Topic Mastery map (Visual breakdown of strong vs weak topics).
3.  **Topic Routing**: Implement server-side logic to serve foundational questions if a "Weak Zone" is detected.
4.  **Structured Output**: Ensure all AI question generation follows the strict Zod schema defined in Section 4.4.

### Phase 3: Mock Interview Suite (Weeks 9-13)
*Goal: The industry-relevant differentiator.*

1.  **WebSocket Infrastructure**: Set up Socket.io for real-time interview streaming.
2.  **AI Interview Agents**: Implement the "Interviewer" and "Silent Grader" agents using LangChain.
3.  **Scorecard System**: Generate post-interview reports with Code Quality, Communication, and Speed metrics.
4.  **Company Mode**: Add templates for FAANG, Startup, and Product company interview styles.

### Phase 4: Growth & Analytics (Weeks 14-16)
*Goal: Retention and virality.*

1.  **Activity Heatmap**: Implement the GitHub-style contribution grid on the dashboard.
2.  **Shareable Profiles**: Create public user profiles (LinkedIn-ready cards).
3.  **Daily Challenges**: Implement the streak system and daily question rotation.
4.  **Long-Term Memory**: Integrate persistent user reflection tags into AI prompts.

---

## 🛠 Next Steps
1.  **Install Dependencies**: `npm install @monaco-editor/react lucide-react socket.io-client`.
2.  **Update `PlayPage`**: Add a switch statement to handle different question types.
3.  **Schema Sync**: Run a Supabase migration to ensure all required fields (like `elo_rating` in `users`) are present.

> [!NOTE]
> You are currently ahead on **Phase 2 (Configurator)** but have pending items from **Phase 1 (Monaco/Code Exec)**. I recommend finishing the Code Space integration next to achieve MVP status.
