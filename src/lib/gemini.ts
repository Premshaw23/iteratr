// ─────────────────────────────────────────────────────────────
// iteratr — Gemini API Client
// Handles question generation and hint generation
// ─────────────────────────────────────────────────────────────
import { MCQSchema, FillSchema, OrderSchema, CodeSchema, InterviewScorecardSchema } from './schemas'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'

// ── Raw Gemini call ───────────────────────────────────────────
let currentKeyIndex = 0

async function callGemini(prompt: string, systemPrompt?: string, retryCount = 0): Promise<string> {
  const allKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean)
  if (allKeys.length === 0) throw new Error('GEMINI_API_KEY is not set')

  // Rotate key based on current index
  const apiKey = allKeys[currentKeyIndex % allKeys.length]

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    ...(systemPrompt && {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
    }),
    generationConfig: {
      temperature:     0.7,
      topP:            0.9,
      maxOutputTokens: 2048,
    },
  }

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      // If we are rate limited (429) and have more keys, rotate and retry
      if ((res.status === 429 || res.status === 401) && retryCount < allKeys.length) {
        console.warn(`Gemini Key ${currentKeyIndex} failed (${res.status}). Rotating...`)
        currentKeyIndex++
        return callGemini(prompt, systemPrompt, retryCount + 1)
      }
      throw new Error(`Gemini API error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) throw new Error('Gemini returned empty response')
    return text
    
  } catch (error: any) {
    if (retryCount < allKeys.length - 1) {
       console.warn(`Gemini Request failed. Rotating... error: ${error.message}`)
       currentKeyIndex++
       return callGemini(prompt, systemPrompt, retryCount + 1)
    }
    throw error
  }
}

// ── Strip markdown code fences from JSON response ─────────────
function extractJSON(raw: string): string {
  return raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

// ═══════════════════════════════════════════════════════════
// QUESTION GENERATION
// ═══════════════════════════════════════════════════════════

export interface GeneratedMCQ {
  type:              'mcq'
  topic:             string
  subtopic:          string
  difficulty_elo:    number
  problem_statement: string
  payload: {
    options:            string[]
    correct_index:      number
    distractor_reasons: string[]
  }
  hints:       string[]
  explanation: string
  tags:        string[]
}

export interface GeneratedFill {
  type:              'fill'
  topic:             string
  subtopic:          string
  difficulty_elo:    number
  problem_statement: string // Contains ___ for blanks
  payload: {
    blanks: {
      position:      number // index in statement, optional but good for internal tracking
      answer:        string
      hint_if_wrong: string
    }[]
  }
  hints:       string[]
  explanation: string
  tags:        string[]
}

export interface GeneratedOrder {
  type:              'order'
  topic:             string
  subtopic:          string
  difficulty_elo:    number
  problem_statement: string // The context/goal (e.g. "Sort the binary search steps")
  payload: {
    steps:           string[] // Correct order
    shuffled_steps:  string[] // Shuffled order for UI
  }
  hints:       string[]
  explanation: string
  tags:        string[]
}

export interface GeneratedCode {
  type:              'code'
  topic:             string
  subtopic:          string
  difficulty_elo:    number
  problem_statement: string
  payload: {
    language:        'python' | 'cpp' | 'javascript'
    scaffold:        string
    hidden_tests:    { input: string, expected_output: string, description: string }[]
    solution:        string
  }
  hints:       string[]
  explanation: string
  tags:        string[]
}

export async function generateMCQ(
  topic: string,
  targetElo: number,
  adaptiveContext: string = '',
  customPrompt?: string
): Promise<GeneratedMCQ> {
  const systemPrompt = `You are an expert computer science educator creating questions for an adaptive coding platform called iteratr.
${adaptiveContext ? `MENTOR CONTEXT:\n${adaptiveContext}` : ''}
Your goal is to generate challenging but fair questions that test REAL understanding, not trivia.
For wrong answer options (distractors), always base them on ACTUAL misconceptions students have.
Never give away the answer in the question itself.
STRICT RULE: Do NOT use LaTeX math mode (e.g., $N$ or $i$) for variables. Use standard markdown backticks instead (e.g., \`N\` or \`i\`).
${customPrompt ? `Additional instructions from the user: ${customPrompt}` : ''}
You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`

  const prompt = `Generate a multiple choice question about: ${topic}
Target difficulty Elo: ${targetElo} (scale: 800=beginner, 1200=intermediate, 1600=advanced)

STRICT JSON format — return ONLY this:
{
  "type": "mcq",
  "topic": "${topic}",
  "subtopic": "specific subtopic within ${topic}",
  "difficulty_elo": ${targetElo},
  "problem_statement": "the full question text",
  "payload": {
    "options": ["option A text", "option B text", "option C text", "option D text"],
    "correct_index": 0,
    "distractor_reasons": [
      "why option A is wrong (if not correct)",
      "why option B is wrong (if not correct)",
      "why option C is wrong (if not correct)",
      "why option D is wrong (if not correct)"
    ]
  },
  "hints": [
    "Level 1: Explain WHY the wrong thinking fails — do not point toward the answer",
    "Level 2: Point toward the general concept without naming it",
    "Level 3: Give a structural clue or analogy",
    "Level 4: Full explanation with reasoning"
  ],
  "explanation": "Complete explanation of the correct answer with reasoning",
  "tags": ["tag1", "tag2"]
}

Rules:
- options array must have exactly 4 items
- correct_index is 0-based (0=A, 1=B, 2=C, 3=D)
- Make 2 options plausibly wrong (common misconceptions), 1 clearly wrong, 1 correct
- distractor_reasons must explain why EACH option is right or wrong (all 4)
- hints must NEVER give the answer directly
- problem_statement must be clear and unambiguous`

  const raw = await callGemini(prompt, systemPrompt)
  const json = extractJSON(raw)
  return MCQSchema.parse(JSON.parse(json)) as GeneratedMCQ
}

// ═══════════════════════════════════════════════════════════
// HINT GENERATION (ReAct loop for code questions)
// ═══════════════════════════════════════════════════════════

export interface HintRequest {
  problem_statement: string
  user_code:         string
  error_output:      string
  failed_test:       string
  hint_level:        1 | 2 | 3 | 4
  hints_so_far:      string[]
}

export async function generateHint(req: HintRequest): Promise<string> {
  const levelDescriptions = {
    1: 'Explain WHY the submitted code/answer is logically wrong. Do NOT point toward the correct solution. Focus on what conceptual gap caused the error.',
    2: 'Give a directional nudge toward the general concept they need. Do not name the exact approach or algorithm.',
    3: 'Give pseudocode structure or a concrete analogy. Do not write working code.',
    4: 'Give a complete explanation with annotated code. This is the final hint — be thorough.',
  }

  const systemPrompt = `You are a Socratic coding mentor. Your ONE rule: never give the answer directly unless it's Level 4.
You reason about WHY the student failed, then give a hint calibrated to close THAT specific gap.
STRICT RULE: Do NOT use LaTeX math mode (e.g., $N$ or $i$) for variables. Use standard markdown backticks instead (e.g., \`N\` or \`i\`).
At Level 1-3, a student should still have to think. At Level 4, give the full solution with explanation.`

  const prompt = `
Problem: ${req.problem_statement}

Student's code:
\`\`\`
${req.user_code}
\`\`\`

Error / test failure:
${req.error_output}

Failed test case:
${req.failed_test}

Previous hints given:
${req.hints_so_far.length > 0 ? req.hints_so_far.join('\n') : 'None yet'}

Generate a Level ${req.hint_level} hint.
Level ${req.hint_level} instruction: ${levelDescriptions[req.hint_level]}

Respond with ONLY the hint text. No preamble, no label, just the hint itself.`

  return await callGemini(prompt, systemPrompt)
}

// ═══════════════════════════════════════════════════════════
// MCQ FEEDBACK GENERATION
// ═══════════════════════════════════════════════════════════

export async function generateMCQFeedback(
  question:       string,
  options:        string[],
  correctIndex:   number,
  chosenIndex:    number,
  distractorReasons: string[]
): Promise<string> {
  if (chosenIndex === correctIndex) {
    return `Correct! ${distractorReasons[correctIndex]}`
  }

  const systemPrompt = `You are a coding mentor explaining why a student's answer is wrong.
Be specific, clear, and educational. Never say "wrong" — explain WHY the reasoning breaks down.
STRICT RULE: Do NOT use LaTeX math mode (e.g., $N$ or $i$) for variables. Use standard markdown backticks instead (e.g., \`N\` or \`i\`).
Keep it to 2-3 sentences.`

  const prompt = `
Question: ${question}
Student chose: "${options[chosenIndex]}"
Correct answer: "${options[correctIndex]}"
Known reason this option fails: ${distractorReasons[chosenIndex]}

Write a 2-3 sentence explanation of why "${options[chosenIndex]}" is incorrect and what the key conceptual difference is.
Do NOT reveal the correct answer explicitly — just explain the flaw in the student's reasoning.`

  return await callGemini(prompt, systemPrompt)
}

// ─────────────────────────────────────────────────────────────
// FILL IN THE BLANK GENERATION
// ─────────────────────────────────────────────────────────────

export async function generateFill(
  topic: string,
  targetElo: number,
  adaptiveContext: string = '',
  customPrompt?: string
): Promise<GeneratedFill> {
  const systemPrompt = `You are an expert computer science educator creating "Fill in the Blank" questions for iteratr.
${adaptiveContext ? `MENTOR CONTEXT:\n${adaptiveContext}` : ''}
Your goal is to choose blanks that reveal a conceptual gap, not syntax trivia.
Example: "A recursive function must have a ___ case to stop..." -> blank: "base".
Do NOT use LaTeX math mode ($N$). Use standard backticks (\`N\`).
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}
You MUST respond with valid JSON only.`

  const prompt = `Generate a Fill in the Blank question about: ${topic}
Target difficulty Elo: ${targetElo}

STRICT JSON format:
{
  "type": "fill",
  "topic": "${topic}",
  "subtopic": "specific subtopic",
  "difficulty_elo": ${targetElo},
  "problem_statement": "The text with exactly 1-3 blanks represented as '___' (three underscores).",
  "payload": {
    "blanks": [
      {
        "answer": "correct_word_or_value",
        "hint_if_wrong": "Specific hint if they get this specific blank wrong."
      }
    ]
  },
  "hints": [
    "Level 1: Conceptual nudge",
    "Level 2: Directional hint",
    "Level 3: Structural/Analogy hint",
    "Level 4: Full answer with reasoning"
  ],
  "explanation": "Complete explanation of the missing terms",
  "tags": ["tag1"]
}

Rules:
- problem_statement must contain between 1 to 3 "___" placeholders.
- payload.blanks must have the SAME number of items as placeholders.
- blanks should be one word or a short value (not long sentences).
- hints must NEVER reveal the answers directly.`

  const raw = await callGemini(prompt, systemPrompt)
  const json = extractJSON(raw)
  return FillSchema.parse(JSON.parse(json)) as GeneratedFill
}

// ─────────────────────────────────────────────────────────────
// DRAG TO ORDER GENERATION
// ─────────────────────────────────────────────────────────────

export async function generateOrder(
  topic: string,
  targetElo: number,
  adaptiveContext: string = '',
  customPrompt?: string
): Promise<GeneratedOrder> {
  const systemPrompt = `You are an expert educator creating "Drag to Order" procedural questions for iteratr.
${adaptiveContext ? `MENTOR CONTEXT:\n${adaptiveContext}` : ''}
Your goal is to test sequential understanding (e.g. algorithms, system flows, OS boot sequences).
STRICT RULE: Do NOT use LaTeX math mode ($N$). Use backticks (\`N\`).
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}
You MUST respond with valid JSON only.`

  const prompt = `Generate a Drag to Order question about: ${topic} (focus on a procedure or process)
Target difficulty Elo: ${targetElo}

STRICT JSON format:
{
  "type": "order",
  "topic": "${topic}",
  "subtopic": "specific specific subtopic",
  "difficulty_elo": ${targetElo},
  "problem_statement": "The goal: e.g. 'Arrange the steps of a TCP handshake in the correct order.'",
  "payload": {
    "steps": ["Step 1 text", "Step 2 text", "Step 3 text", "Step 4 text"],
    "shuffled_steps": ["Random step", "Another random step", "..."]
  },
  "hints": [
    "Level 1: Focus on the starting condition",
    "Level 2: Focus on the mid-process transition",
    "Level 3: Hint about what must come before another step",
    "Level 4: Full sequential explanation"
  ],
  "explanation": "Detailed explanation of the sequence",
  "tags": ["algorithm", "procedure"]
}

Rules:
- Provide 4 to 6 steps.
- 'shuffled_steps' must be a random shuffle of the 'steps' array.
- steps must be clearly distinct and sequential.`

  const raw = await callGemini(prompt, systemPrompt)
  const json = extractJSON(raw)
  return OrderSchema.parse(JSON.parse(json)) as GeneratedOrder
}

// ─────────────────────────────────────────────────────────────
// CODE SPACE GENERATION
// ─────────────────────────────────────────────────────────────

export async function generateCodeSpace(
  topic: string,
  targetElo: number,
  language: 'python' | 'cpp' | 'javascript' = 'python',
  adaptiveContext: string = '',
  customPrompt?: string
): Promise<GeneratedCode> {
  const systemPrompt = `You are a senior Software Engineer creating coding challenges for iteratr.
${adaptiveContext ? `MENTOR CONTEXT:\n${adaptiveContext}` : ''}
Your goal is to test logic and algorithm implementation.
Avoid boilerplate — provide a clean scaffold (method signature + docstring).
Generate 3-5 hidden test cases including edge cases (empty input, large values, etc.).
STRICT JSON format.`

  const prompt = `Generate a Coding Challenge about: ${topic}
Language: ${language}
Target difficulty Elo: ${targetElo}

STRICT JSON format:
{
  "type": "code",
  "topic": "${topic}",
  "subtopic": "specific subtopic",
  "difficulty_elo": ${targetElo},
  "problem_statement": "The full markdown description of the problem.",
  "payload": {
    "language": "${language}",
    "scaffold": "def solution(...):\\n    # your code here",
    "hidden_tests": [
      { "input": "...", "expected_output": "...", "description": "basic case" },
      { "input": "...", "expected_output": "...", "description": "edge case" }
    ],
    "solution": "the full correct code"
  },
  "hints": [
    "Level 1: Big picture logic",
    "Level 2: Data structure nudge",
    "Level 3: Pseudocode / logic hint",
    "Level 4: Full walkthrough with code snippets"
  ],
  "explanation": "Detailed explanation of the optimal solution",
  "tags": ["algorithm", "${language}"]
}

Rules:
- Problem statement should be in professional markdown.
- Hidden tests must be valid inputs for the generated solution.
- The scaffold MUST match the language syntax.`

  const raw = await callGemini(prompt, systemPrompt)
  const json = extractJSON(raw)
  return CodeSchema.parse(JSON.parse(json)) as GeneratedCode
}

// ─────────────────────────────────────────────────────────────
// CODE EVALUATION
// ─────────────────────────────────────────────────────────────

const LANG_MAP: Record<string, number> = {
  python:     71,
  cpp:        54,
  javascript: 63
}

async function runOnJudge0(source_code: string, language: string, stdin?: string) {
  const apiKey = process.env.JUDGE0_API_KEY
  const apiUrl = process.env.JUDGE0_API_URL || 'https://ce.judge0.com'
  if (!apiKey) return null

  try {
    const res = await fetch(`${apiUrl}/submissions?base64_encoded=false&wait=true`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'X-Auth-Token':   apiKey, // Official Judge0 CE uses X-Auth-Token
      },
      body: JSON.stringify({
        source_code,
        language_id: LANG_MAP[language] || 71,
        stdin
      })
    })

    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('Judge0 Error:', err)
    return null
  }
}

export async function evaluateCode(
  problem: string,
  userCode: string,
  language: string,
  hiddenTests: { input: string, expected_output: string, description: string }[]
): Promise<{ isCorrect: boolean, feedback: string }> {
  
  let executionResults: any[] = []
  let allPassed = true

  // 1. Try real execution on Judge0
  if (process.env.JUDGE0_API_KEY) {
    for (const test of hiddenTests) {
      const result = await runOnJudge0(userCode, language, test.input)
      if (result) {
        const stdout   = (result.stdout || '').trim()
        const expected = (test.expected_output || '').trim()
        const passed   = stdout === expected
        executionResults.push({ input: test.input, stdout, status: result.status?.description, passed })
        if (!passed) allPassed = false
      }
    }
  }

  // 2. Use Gemini for final feedback and logic verification
  const systemPrompt = `You are a code execution engine and mentor. 
  Assess the student's code. 
  If real execution results (JUDGE0_RESULTS) are provided, use them to check correctness.
  Respond ONLY with JSON: { "isCorrect": boolean, "feedback": "2-3 sentences explaining success or failure" }`

  const prompt = `Problem: ${problem}
  Language: ${language}
  User Code: ${userCode}
  JUDGE0_RESULTS: ${JSON.stringify(executionResults)}
  
  Analyze the logic and the outputs. If all test cases passed on Judge0, it's correct.`

  const raw = await callGemini(prompt, systemPrompt)
  try {
    const json = JSON.parse(extractJSON(raw))
    return {
      isCorrect: executionResults.length > 0 ? allPassed : (json.isCorrect ?? false),
      feedback:  json.feedback ?? "Evaluation complete."
    }
  } catch {
    return { isCorrect: false, feedback: "Evaluation format error." }
  }
}

// ─────────────────────────────────────────────────────────────
// FILL SEMANTIC EVALUATION
// ─────────────────────────────────────────────────────────────

export async function evaluateFillAnswers(
  problem: string,
  userAnswers: string[],
  correctAnswers: string[]
): Promise<{ isCorrect: boolean[], generalFeedback: string }> {
  const systemPrompt = `You are a technical mentor checking a student's fill-in-the-blank answers. 
Accept semantic equivalents (e.g., "0" vs "zero", "linear" vs "O(n)").
Respond ONLY with JSON: { "isCorrect": boolean[], "generalFeedback": "one helpful sentence" }`

  const prompt = `Problem: ${problem}
Expected Answers: ${JSON.parse(JSON.stringify(correctAnswers))}
Student Input: ${JSON.parse(JSON.stringify(userAnswers))}

Evaluate each input in the array. Is it semantically correct for its specific blank?`

  const raw = await callGemini(prompt, systemPrompt)
  const json = extractJSON(raw)
  const result = JSON.parse(json)
  return {
    isCorrect:      result.isCorrect as boolean[],
    generalFeedback: result.generalFeedback
  }
}
// ─────────────────────────────────────────────────────────────
// MOCK INTERVIEW AGENT
// ─────────────────────────────────────────────────────────────

export interface InterviewMessage {
  role: 'interviewer' | 'candidate'
  content: string
}

export async function generateInterviewResponse(
  problem: string,
  history: InterviewMessage[],
  userCode: string,
  style: string = 'neutral'
): Promise<string> {
  const styles: Record<string, string> = {
    friendly: "You are a warm, encouraging mentor. You nudge them with kindness and analogies.",
    neutral:  "You are a professional, efficient interviewer. You are fair but direct.",
    strict:   "You are an intimidating, high-pressure FAANG interviewer. You ask critical follow-up questions about space/time complexity even for minor parts."
  }

  const systemPrompt = `You are a Senior Technical Interviewer at a top-tier tech company. 
  ${styles[style] || styles.neutral}
  
  CURRENT PROBLEM: ${problem}
  
  RULES:
  1. Never write the full solution for the candidate.
  2. If they are stuck, give a directional nudge.
  3. If they finished, ask about time/space complexity or possible edge cases.
  4. Respond like a human in a conversation. Keep responses to 1-3 paragraphs.
  5. You can see their current code in the IDE (pasted below). 
  6. Use technical terminology correctly.
  7. **CRITICAL: DYNAMIC TASK UPDATES**
     If you ever pivot the interview to a new scenario, a new part of a problem, or a completely different challenge (e.g., shifting from 'BFS Traversal' to 'Shortest Path'), you **MUST** include a \[TASK_UPDATE: new problem description\] block at the very start of your response. 
     
     EXAMPLE:
     User solved BFS? You want to ask about Shortest Path? 
     Response: "[TASK_UPDATE: Modify your code to find the shortest path from 'src' to 'target' in an unweighted graph.] Great job on the traversal. Now, how would we modification this to find the shortest path?"
     
     This is the ONLY way the user's right panel will update. Use it whenever the core objective evolves.`

  const conversationText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')

  const prompt = `
  Current Code in Candidate's IDE:
  \`\`\`
  ${userCode || '# No code written yet'}
  \`\`\`

  Conversation History:
  ${conversationText}

  Candidate just said/sent:
  ${history[history.length - 1]?.content || "[Interview Started]"}

  Generate your response as the INTERVIEWER.`

  return await callGemini(prompt, systemPrompt)
}

// ─────────────────────────────────────────────────────────────
// INTERVIEW EVALUATION
// ─────────────────────────────────────────────────────────────

export interface InterviewScorecard {
  overall_score: number // 0-100
  communication: { score: number, feedback: string }
  logic:         { score: number, feedback: string }
  optimization:  { score: number, feedback: string }
  summary:       string
  hire_decision: "Strong Hire" | "Hire" | "Leaning No Hire" | "No Hire"
}

export async function evaluateInterview(
  problem: string,
  history: InterviewMessage[],
  userCode: string
): Promise<InterviewScorecard> {
  const systemPrompt = `You are a Lead Engineer conducting a review of a candidate's mock interview.
  Analyze the conversation history and the final code. 
  
  CRITERIA:
  1. Communication: Did they explain their thinking? Did they ask clarifying questions?
  2. Logic: Is the code correct? Did it handle edge cases?
  3. Optimization: Did they discuss time/space complexity? 
  
  Respond ONLY with valid JSON.`

  const conversationText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')

  const prompt = `
  PROBLEM: ${problem}
  
  FINAL CODE:
  \`\`\`
  ${userCode}
  \`\`\`
  
  INTERVIEW TRANSCRIPT:
  ${conversationText}
  
  Evaluate the performance across the criteria. 
  
  JSON Format:
  {
    "overall_score": 85,
    "communication": { "score": 9, "feedback": "..." },
    "logic": { "score": 8, "feedback": "..." },
    "optimization": { "score": 7, "feedback": "..." },
    "summary": "Full summary of performance",
    "hire_decision": "Strong Hire"
  }`

  const raw = await callGemini(prompt, systemPrompt)
  const json = extractJSON(raw)
  return InterviewScorecardSchema.parse(JSON.parse(json)) as InterviewScorecard
}

// ─────────────────────────────────────────────────────────────
// USER REFLECTION (Long-term Memory)
// ─────────────────────────────────────────────────────────────

export async function generateUserReflection(
  userName: string,
  stats: any[],
  recentAttempts: any[]
): Promise<string> {
  const systemPrompt = `You are a career coach analyzing a student's progress. 
  Summarize their current state in EXACTLY 2 sentences. 
  Focus on their strengths and one specific area where they need to bridge a gap.
  Use a second-person perspective ("You...").`

  const prompt = `User: ${userName}
  Topic Stats: ${JSON.stringify(stats)}
  Recent Attempts: ${JSON.stringify(recentAttempts)}
  
  Generate the 2-sentence reflection.`

  return await callGemini(prompt, systemPrompt)
}
