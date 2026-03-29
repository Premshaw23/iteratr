import { supabaseAdmin } from './supabase'

/**
 * Fetches user performance data and generates a concise context string 
 * for the AI to personalize the session.
 */
export async function getAdaptiveMentorContext(userEmail: string): Promise<string> {
  // 1. Fetch user ID and general stats
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, elo_rating')
    .eq('email', userEmail)
    .single()

  if (!user) return ''

  // 2. Fetch weak zones and recent failures
  const { data: stats } = await supabaseAdmin
    .from('topic_stats')
    .select('topic, subtopic, fail_count, solved_count, is_weak_zone')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  if (!stats || stats.length === 0) {
    return `User is relatively new with an Elo of ${user.elo_rating}. Start with balanced foundational questions.`
  }

  // 3. Identify specific gaps
  const weakZones = stats.filter(s => s.is_weak_zone || s.fail_count > s.solved_count)
  const strengths = stats.filter(s => s.solved_count > s.fail_count * 2)

  let context = `Current User Elo: ${user.elo_rating}.\n`

  if (weakZones.length > 0) {
    context += `CRITICAL GAPS: User is struggling with ${weakZones.map(s => `"${s.subtopic}" (${s.topic})`).join(', ')}. 
    Focus on bridging these gaps. If they fail, provide deeper socratic hints.\n`
  }

  if (strengths.length > 0) {
    context += `STRENGTHS: User is proficient in ${strengths.map(s => s.subtopic).join(', ')}. Feel free to increase complexity for these topics.\n`
  }

  context += `GOAL: Be an adaptive mentor. If you see a gap, nudge them toward the fundamentals of that concept.`

  return context
}
