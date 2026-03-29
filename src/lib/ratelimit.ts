import { supabaseAdmin } from './supabase'

/**
 * simpleRateLimit
 * Checks if a user has exceeded a given limit within a sliding window.
 * Uses the 'attempts' table as a proxy for activity.
 */
export async function checkRateLimit(userId: string, limit: number = 200, windowMinutes: number = 60) {
  const windowStart = new Date(Date.now() - windowMinutes * 60000).toISOString()

  // 1. Check attempts count in the window
  const { count, error } = await supabaseAdmin
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('created_at', windowStart)

  if (error) return true // Fail safe: allow if DB check fails

  return (count || 0) < limit
}

/**
 * checkGenerationLimit
 * Global limit to protect Gemini keys across all users.
 */
export async function checkGenerationLimit() {
  const windowStart = new Date(Date.now() - 15 * 60000).toISOString()
  
  const { count, error } = await supabaseAdmin
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .gt('created_at', windowStart)

  if (count && count > 500) return false // High limit for test

  return true
}
