const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })
const { createServer } = require('http')
const { Server } = require('socket.io')

// We use the built-in fetch in Node 18+ to call Gemini
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'
// console.log(GEMINI_API_URL)
async function callGemini(prompt, systemInstruction) {
  const apiKeys = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split(',').map(k => k.trim()) : []
  
  if (apiKeys.length === 0) {
    console.error('--- Gemini API Key Error: Missing key ---')
    return "Interviewer service unavailable (API key missing)."
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { 
      temperature: 0.7, 
      maxOutputTokens: 1024,
      responseMimeType: 'text/plain'
    }
  }

  // Iterate through available keys if one fails
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i]
    try {
      console.log(`--- Calling Gemini API (Key ${i + 1}/${apiKeys.length}) ---`)
      const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.warn(`--- Gemini API Key ${i + 1} Failed (${res.status}): Try next...`)
        continue // Try next key
      }

      const data = await res.json()
      if (data.error) {
        console.warn(`--- Gemini API Data Error on Key ${i + 1}: Try next...`)
        continue // Try next key
      }

      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!content) {
        console.warn('--- Gemini API Empty Content (Safety block or config issue) ---')
        return "I'm processing your logic. Let's dig deeper into the complexity..."
      }

      console.log(`--- Gemini API Response received (Key ${i + 1}) ---`)
      return content

    } catch (err) {
      console.error(`--- Gemini Fetch Exception on Key ${i + 1}:`, err.message)
      if (i === apiKeys.length - 1) {
        return "Interviewer network error. Please try again in a moment."
      }
    }
  }

  return "All interviewer nodes are currently busy. Let's pause for a second."
}

const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
    return
  }

  // Fallback for health checks or arbitrary HTTP requests
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Iteratr WebSocket server is running')
})
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

console.log('--- iteratr REAL-TIME WEBSOCKET AI SERVER STARTING ---')

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('start-interview', (data) => {
    console.log('Starting interview session:', data.sessionId)
    socket.join(data.sessionId)
  })

  socket.on('chat-message', async (data) => {
    const { sessionId, message, history, userCode, problem } = data
    console.log(`[Message in session ${sessionId}]:`, message)

    socket.emit('interviewer-typing', { status: 'reasoning' })

    const systemPrompt = `You are a Senior Technical Interviewer at a top-tier firm.
    
    CURRENT TASK: ${problem}
    
    CONDUCT RULES:
    1. BE DECISIVE. If the candidate explains a concept correctly, ACKNOWLEDGE it and MOVE ON immediately. Do NOT ask for the same reasoning twice.
    2. BE HUMAN. If the logic is sound, don't just say 'I understand'. Nudge them toward the next part of the problem.
    3. PIVOT WHEN READY. When the current task is mastered, you MUST pivot to a follow-up (e.g., optimization, edge cases, or a related scenario) using the [TASK_UPDATE: new markdown description] tag. **IMPORTANT**: If the new task requires a different starting code structure, you MUST include a markdown code block with the new scaffold immediately after the tag.
    4. You can see their live IDE code: ${userCode || 'No code written'}. Refer to it directly.
    5. Don't give the full solution. Maintain a professional, high-pressure yet fair interview vibe.`

    const conversationText = history ? history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') : message
    const prompt = `Conversation history:\n${conversationText}\n\nCandidate just said: ${message}\n\nGenerate your response.`

    const aiResponse = await callGemini(prompt, systemPrompt)
    
    socket.emit('interviewer-message', {
      role: 'interviewer',
      content: aiResponse,
    })

    // --- Silent Grader Logic ---
    const graderPrompt = `Analyze this interview segment. 
    Problem: ${problem}
    Code: ${userCode}
    History: ${conversationText}
    Candidate said: ${message}
    
    Response format: JSON { "observation": "one short sentence (max 15 words)", "score": 1-100 }`
    
    const graderSys = "You are a silent grader. Be ultra-concise. Provide a JSON feedback."
    const graderRaw = await callGemini(graderPrompt, graderSys)
    
    try {
      const graderJson = JSON.parse(graderRaw.replace(/```json/g, '').replace(/```/g, ''))
      socket.emit('grader-feedback', graderJson)
    } catch {
      // Just a fallback if AI doesn't return clean JSON
    }
  })

  socket.on('submit-code', (data) => {
    socket.emit('interviewer-typing', { status: 'reviewing-code' })
    // In a real app, this could trigger a more intense review.
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || process.env.WS_PORT || 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server is running on port ${PORT}`)
})
