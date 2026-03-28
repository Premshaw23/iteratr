import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateMCQ, generateFill, generateOrder, generateCodeSpace } from '@/lib/gemini'
import { getTargetQuestionElo } from '@/lib/elo'

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { topic = 'arrays', customPrompt, language = 'python' } = body

  // Get user's current Elo
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, elo_rating')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // ── 1. Decide on a question type first ──────────────────────────
  const types: ('mcq' | 'fill' | 'order' | 'code')[] = ['mcq', 'fill', 'order', 'code']
  const typeToGenerate = types[Math.floor(Math.random() * types.length)]

  // ── 2. Check if a suitable question exists in Cache ───────────
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

  // ── 3. Fallback: Generate fresh question from Gemini ──────────
  try {
    let generated: any
    if (typeToGenerate === 'fill')      generated = await generateFill(topic, targetElo, customPrompt)
    else if (typeToGenerate === 'order') generated = await generateOrder(topic, targetElo, customPrompt)
    else if (typeToGenerate === 'code')  generated = await generateCodeSpace(topic, targetElo, language as any, customPrompt)
    else                               generated = await generateMCQ(topic, targetElo, customPrompt)

    // Save to DB so we reuse it for other users
    const { data: saved, error } = await supabaseAdmin
      .from('questions')
      .insert({
        type:              generated.type,
        topic:             generated.topic as any,
        subtopic:          generated.subtopic,
        difficulty_elo:    generated.difficulty_elo,
        problem_statement: generated.problem_statement,
        payload:           generated.payload,
        hints:             generated.hints,
        explanation:       generated.explanation,
        tags:              generated.tags,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving question:', error)
      // Still return the generated question even if save fails
      return NextResponse.json({ question: generated, source: 'generated' })
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
