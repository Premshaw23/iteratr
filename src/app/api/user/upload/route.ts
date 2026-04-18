import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

interface UploadedData {
  type: 'learning_goals' | 'notes' | 'code_snippets' | 'interview_prep' | 'other'
  title: string
  content: string
  tags?: string[]
  isPublic?: boolean
}

// Maximum file size: 1 MB for text content
const MAX_CONTENT_LENGTH = 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, title, content, tags = [], isPublic = false } = body as UploadedData

    // Validation
    if (!type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, content' },
        { status: 400 }
      )
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content exceeds maximum size of ${MAX_CONTENT_LENGTH / 1024}KB` },
        { status: 413 }
      )
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be less than 255 characters' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create upload record in user_uploads table
    const { data, error } = await supabaseAdmin
      .from('user_uploads' as any)
      .insert({
        user_id: user.id,
        type,
        title,
        content,
        tags,
        is_public: isPublic,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Upload creation error:', error)
      return NextResponse.json(
        { error: 'Failed to save upload' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        upload_id: (data as any)?.id,
        message: 'Data uploaded successfully',
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user's uploads
    const { data, error, count } = await supabaseAdmin
      .from('user_uploads' as any)
      .select('id, type, title, tags, is_public, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Fetch uploads error:', error)
      return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
    }

    return NextResponse.json({
      uploads: data,
      total: count,
      limit,
      offset,
    })
  } catch (err: any) {
    console.error('GET uploads error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('id')

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 })
    }

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify ownership and delete
    const { error: deleteError } = await supabaseAdmin
      .from('user_uploads' as any)
      .delete()
      .eq('id', uploadId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete upload error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Upload deleted' })
  } catch (err: any) {
    console.error('DELETE upload error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
