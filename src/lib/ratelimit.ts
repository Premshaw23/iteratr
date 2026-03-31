import { supabaseAdmin } from './supabase'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

function getUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const redis = new Redis({ url, token })
  return { redis }
}

/**
 * simpleRateLimit
 * Checks if a user has exceeded a given limit within a sliding window.
 * Uses the 'attempts' table as a proxy for activity.
 */
export async function checkRateLimit(userId: string, isPro: boolean = false) {
  // Prefer Upstash if configured (fast + no DB scan).
  const upstash = getUpstash()
  if (upstash) {
    const baseLimit = isPro ? 1000 : 150
    const hardLimit = isPro ? baseLimit : baseLimit + 5 // free users get small "finish session" grace

    const ratelimit = new Ratelimit({
      redis: upstash.redis,
      limiter: Ratelimit.fixedWindow(hardLimit, '1 d'),
      prefix: 'iteratr:rl:user_daily',
      analytics: true,
    })

    const key = userId
    const result = await ratelimit.limit(key)

    if (result.success) {
      const used = hardLimit - result.remaining
      return {
        allowed: true,
        nearLimit: used > baseLimit * 0.8,
        graceActive: !isPro && used >= baseLimit,
      }
    }

    return { allowed: false }
  }

  const windowStart = new Date()
  windowStart.setHours(0, 0, 0, 0) // Start of today

  const { count, error } = await supabaseAdmin
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('created_at', windowStart.toISOString())

  if (error) return { allowed: true }

  const baseLimit = isPro ? 1000 : 150 
  const currentCount = count || 0

  // Grace Period: Enable them to finish an active session (up to 5 extra)
  if (currentCount < baseLimit) {
    return { allowed: true, nearLimit: currentCount > baseLimit * 0.8 }
  }

  // Final Grace: Still allow up to 5 extra if they are currently in a session
  if (!isPro && currentCount < baseLimit + 5) {
    return { allowed: true, graceActive: true }
  }

  return { allowed: false }
}

/**
 * checkGenerationLimit
 * Global limit to protect Gemini keys across all users.
 */
export async function checkGenerationLimit() {
  // Prefer Upstash if configured (fast + no DB scan).
  const upstash = getUpstash()
  if (upstash) {
    // Allow up to 500 generations per 15 minutes across all users.
    const ratelimit = new Ratelimit({
      redis: upstash.redis,
      limiter: Ratelimit.slidingWindow(500, '15 m'),
      prefix: 'iteratr:rl:gen_global',
      analytics: true,
    })

    const result = await ratelimit.limit('global')
    return result.success
  }

  const windowStart = new Date(Date.now() - 15 * 60000).toISOString()
  
  const { count, error } = await supabaseAdmin
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .gt('created_at', windowStart)

  if (count && count > 500) return false // High limit for test

  return true
}
