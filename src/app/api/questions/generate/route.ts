import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateMCQ, generateFill, generateOrder, generateCodeSpace } from '@/lib/gemini'
import { getTargetQuestionElo } from '@/lib/elo'
import { getAdaptiveMentorContext } from '@/lib/mentor'
import { checkRateLimit } from '@/lib/ratelimit'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { topic = 'arrays', subtopic, customPrompt, language = 'cpp', isDaily = false, forceType } = body
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, elo_rating, is_pro')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // ── RATE LIMIT ──────────────────────────────────
    const { allowed, nearLimit, graceActive } = await checkRateLimit(user.id, user.is_pro)
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Technical Quota Exhausted',
        message: user.is_pro 
          ? 'You have reached your high-intensity daily limit. Please allow our engines to cool down and return tomorrow for a fresh reset.' 
          : 'Your daily technical evaluation quota is full. To maintain high-fidelity training for all users, please wait until tomorrow or upgrade to Pro for unlimited compute cycles.',
        code: 'QUOTA_EXCEEDED',
        is_pro: user.is_pro
      }, { status: 429 })
    }

  // ── 1. Check for Daily Challenge if requested ──────────────────
  if (isDaily) {
    const today = new Date().toISOString().split('T')[0]
    const { data: dailyQ } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('is_daily_challenge', true)
      .gte('created_at', `${today}T00:00:00Z`)
      .limit(1)
      .single()

    if (dailyQ) {
      return NextResponse.json({ question: dailyQ, source: 'daily' })
    }
  }

  // ── 2. Decide on a question type first ──────────────────────────
  const types: ('mcq' | 'fill' | 'order' | 'code')[] = ['mcq', 'fill', 'order', 'code']
  const forcedType = typeof forceType === 'string' ? forceType.toLowerCase() : null
  const typeToGenerate =
    forcedType === 'mcq' || forcedType === 'fill' || forcedType === 'order' || forcedType === 'code'
      ? (forcedType as 'mcq' | 'fill' | 'order' | 'code')
      : types[Math.floor(Math.random() * types.length)]

  // ── 3. Check if a suitable question exists in Cache ───────────
  // Fetch IDs of questions the user has already solved
  const { data: attempted } = await supabaseAdmin
    .from('attempts')
    .select('question_id')
    .eq('user_id', user.id)

  const attemptedIds = attempted?.map(a => a.question_id) || []

  const targetElo = getTargetQuestionElo(user.elo_rating)
  const eloMin    = targetElo - 150
  const eloMax    = targetElo + 150

  const { data: existing } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('type', typeToGenerate) // Search specifically for our chosen type
    .eq('topic', topic)
    .gte('difficulty_elo', eloMin)
    .lte('difficulty_elo', eloMax)
    .not('id', 'in', `(${attemptedIds.length > 0 ? attemptedIds.map(id => `"${id}"`).join(',') : '""'})`) 
    .limit(1)

  // Use the cached question if type matches and isn't code (or language matches code)
  if (existing && existing.length > 0) {
    const question = existing[0]
    const passesLang = question.type !== 'code' || (question.payload as any).language === language
    if (passesLang) {
      return NextResponse.json({ question, source: 'cache' })
    }
  }

  // ── 4. Fallback: Generate fresh question from Gemini ──────────
  try {
    const adaptiveContext = await getAdaptiveMentorContext(session.user.email)

    let generated: any
    if (typeToGenerate === 'fill')      generated = await generateFill(topic, targetElo, adaptiveContext, customPrompt, subtopic)
    else if (typeToGenerate === 'order') generated = await generateOrder(topic, targetElo, adaptiveContext, customPrompt, subtopic)
    else if (typeToGenerate === 'code')  generated = await generateCodeSpace(topic, targetElo, language as any, adaptiveContext, customPrompt, subtopic)
    else                               generated = await generateMCQ(topic, targetElo, adaptiveContext, customPrompt, subtopic)

    // Save to DB so we reuse it for other users
    const { data: saved, error } = await supabaseAdmin
      .from('questions')
      .insert({
        type:               generated.type,
        topic:              generated.topic as any,
        subtopic:           generated.subtopic,
        difficulty_elo:     generated.difficulty_elo,
        problem_statement:  generated.problem_statement,
        payload:            generated.payload,
        hints:              generated.hints,
        explanation:        generated.explanation,
        tags:               generated.tags,
        is_daily_challenge: isDaily,
      })
      .select()
      .single()

    if (error) {
      console.error('CRITICAL: DB Save Failure for dynamic question:', error)
      return NextResponse.json({ 
        error: 'Failed to record generated question in database',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ question: saved, source: 'generated' })

  } catch (err) {
    console.error('Gemini generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate question. Check GEMINI_API_KEY.' },
      { status: 500 }
    )
  }
}
