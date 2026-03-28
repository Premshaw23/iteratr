// ─────────────────────────────────────────────────────────────
// iteratr — Database Types
// Mirrors the exact Supabase schema
// ─────────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'fill' | 'code' | 'order'

export type Topic =
  | 'arrays'
  | 'trees'
  | 'graphs'
  | 'dynamic_programming'
  | 'linked_lists'
  | 'system_design'
  | 'os_concepts'
  | 'networking'
  | 'mixed'

// ── MCQ payload ───────────────────────────────────────────────
export interface MCQPayload {
  options: string[]          // always 4 options
  correct_index: number      // 0-3
  distractor_reasons: string[] // why each wrong option fails
}

// ── Fill in the blank payload ─────────────────────────────────
export interface FillPayload {
  blanks: {
    position: number
    answer: string
    hint_if_wrong: string
  }[]
}

// ── Code space payload ────────────────────────────────────────
export interface CodePayload {
  language: 'python' | 'cpp' | 'javascript'
  scaffold: string           // starter code shown to user
  hidden_tests: {
    input: string
    expected_output: string
    description: string      // e.g. "empty array edge case"
  }[]
  solution: string           // never sent to client
}

// ── Drag to order payload ─────────────────────────────────────
export interface OrderPayload {
  steps: string[]            // correct order
}

export type QuestionPayload = MCQPayload | FillPayload | CodePayload | OrderPayload

// ─────────────────────────────────────────────────────────────
// DATABASE TABLES
// ─────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {

      // ── users ────────────────────────────────────────────
      users: {
        Row: {
          id: string                    // UUID, from NextAuth
          email: string
          display_name: string
          avatar_url: string | null
          preferred_language: 'python' | 'cpp' | 'javascript'
          elo_rating: number            // starts at 1200
          streak_count: number
          longest_streak: number
          reflection_text: string | null // AI-generated memory
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          preferred_language?: 'python' | 'cpp' | 'javascript'
          elo_rating?: number
          streak_count?: number
          longest_streak?: number
          reflection_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }

      // ── questions ────────────────────────────────────────
      questions: {
        Row: {
          id: string
          type: QuestionType
          topic: Topic
          subtopic: string
          difficulty_elo: number
          problem_statement: string
          payload: QuestionPayload
          hints: string[]              // array of 4 hint strings
          explanation: string          // full explanation shown after level 4
          tags: string[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['questions']['Insert']>
      }

      // ── attempts ─────────────────────────────────────────
      attempts: {
        Row: {
          id: string
          user_id: string
          question_id: string
          submitted_answer: string      // serialised answer
          is_correct: boolean
          hints_used: number            // 0-4
          time_taken_seconds: number
          elo_before: number
          elo_after: number
          elo_change: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['attempts']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['attempts']['Insert']>
      }

      // ── sessions ──────────────────────────────────────────
      sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'practice' | 'interview'
          config: {
            topics: Topic[]
            format: QuestionType | 'mixed'
            difficulty: 'auto' | 'easy' | 'hard' | 'interview'
            language: 'python' | 'cpp' | 'javascript'
            time_pressure: 'none' | 'soft' | 'hard'
            interviewer_style: 'friendly' | 'neutral' | 'strict'
            custom_prompt: string | null
            company_mode: string | null
          }
          score_code: number | null
          score_comms: number | null
          score_speed: number | null
          transcript: object | null
          completed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }

      // ── elo_history ───────────────────────────────────────
      elo_history: {
        Row: {
          id: string
          user_id: string
          elo_before: number
          elo_after: number
          elo_change: number
          reason: string               // e.g. "correct, 0 hints, fast"
          question_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['elo_history']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['elo_history']['Insert']>
      }

      // ── topic_stats ───────────────────────────────────────
      topic_stats: {
        Row: {
          id: string
          user_id: string
          topic: Topic
          subtopic: string
          solved_count: number
          fail_count: number
          is_weak_zone: boolean        // true if fail_count >= 3
          consecutive_correct: number  // resets weak zone at 3
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['topic_stats']['Row'], 'id' | 'updated_at'> & {
          id?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['topic_stats']['Insert']>
      }
    }
  }
}

// ── Convenience row types ─────────────────────────────────────
export type UserRow         = Database['public']['Tables']['users']['Row']
export type QuestionRow     = Database['public']['Tables']['questions']['Row']
export type AttemptRow      = Database['public']['Tables']['attempts']['Row']
export type SessionRow      = Database['public']['Tables']['sessions']['Row']
export type EloHistoryRow   = Database['public']['Tables']['elo_history']['Row']
export type TopicStatsRow   = Database['public']['Tables']['topic_stats']['Row']
