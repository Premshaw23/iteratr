import { supabaseAdmin } from './supabase'

const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent'

/**
 * Generates a vector embedding for a piece of text using Gemini.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const allKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean)
  if (allKeys.length === 0) throw new Error('GEMINI_API_KEY is not set')

  // Use the first key for embeddings to keep it simple
  const apiKey = allKeys[0]

  try {
    const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [{ text }]
        }
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini Embedding Error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    return data.embedding.values
  } catch (error) {
    console.error('Embedding Generation Failure:', error)
    throw error
  }
}

/**
 * Searches the knowledge base for relevant context.
 */
export async function searchKnowledge(query: string, matchThreshold: number = 0.5, matchCount: number = 3) {
  try {
    const queryEmbedding = await getEmbedding(query)
    // Convert number[] to string format for pgvector rpc: "[0.1, 0.2, ...]"
    const vectorString = `[${queryEmbedding.join(',')}]`
    
    const { data, error } = await supabaseAdmin.rpc('match_knowledge', {
      query_embedding: vectorString,
      match_threshold: matchThreshold,
      match_count:     matchCount,
    })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Vector Search Failure:', err)
    return []
  }
}

/**
 * Adds a document to the RAG knowledge base.
 */
export async function injectKnowledge(content: string, metadata: any = {}) {
  const embedding = await getEmbedding(content)
  const vectorString = `[${embedding.join(',')}]`
  
  const { error } = await supabaseAdmin
    .from('knowledge_base')
    .insert({
      content,
      metadata,
      embedding: vectorString
    })

  if (error) throw error
  return { success: true }
}
