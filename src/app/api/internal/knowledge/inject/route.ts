import { NextRequest, NextResponse } from 'next/server'
import { injectKnowledge } from '@/lib/vector'

export const dynamic = 'force-dynamic'

/**
 * Admin-only endpoint to add RAG documents.
 *
 * Hidden/internal route:
 *   POST /api/internal/knowledge/inject
 *
 * Security model:
 * - Requires header: `x-admin-key: <RAG_ADMIN_KEY>`
 * - Use a long random value in env (do NOT reuse NEXTAUTH_SECRET).
 */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (!process.env.RAG_ADMIN_KEY || adminKey !== process.env.RAG_ADMIN_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { content, metadata } = body as { content?: string; metadata?: any }

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  try {
    await injectKnowledge(content, metadata ?? {})
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to inject knowledge', message: e?.message }, { status: 500 })
  }
}

