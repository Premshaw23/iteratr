import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ── Generic check (prevents createClient from throwing if keys are missing during static generation) ──
const isMissingKeys = !supabaseUrl || !supabaseAnonKey

// ── Browser client (use in components) ───────────────────────
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-for-build'
)

// ── Server client (use in API routes — has full access) ───────
export const supabaseAdmin = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-for-build',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
