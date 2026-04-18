// ─────────────────────────────────────────────────────────────
// iteratr — Gemini API Client
// Handles question generation and hint generation
// ─────────────────────────────────────────────────────────────
import { MCQSchema, FillSchema, OrderSchema, CodeSchema, InterviewScorecardSchema } from './schemas'
// import { runAgainstHiddenTests } from './judge0'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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
      maxOutputTokens: 16384,  // Increased from 8192 to handle longer responses
      // Note: Removed responseMimeType - explicit prompt instructions work better
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
  // First, try to extract from markdown code blocks
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const content = codeBlockMatch ? codeBlockMatch[1] : raw

  // Try to find a valid JSON object by finding opening { and finding the matching }
  const trimmed = content.trim()

  // Find the first { or [
  let startIdx = trimmed.search(/[\{\[]/)
  if (startIdx === -1) {
    // Log what we received for debugging
    console.error('No JSON object or array found. Raw response preview:', trimmed.substring(0, 500))
    throw new Error('No JSON found in response - Gemini may not be returning JSON format')
  }

  // Try to parse from this position onwards
  let bestCandidate = null
  let bestError = null

  for (let endIdx = trimmed.length; endIdx > startIdx; endIdx--) {
    try {
      const candidate = trimmed.substring(startIdx, endIdx)
      // Quick validation - should end with } or ]
      if (!candidate.trim().match(/[\}\]]$/)) continue
      const parsed = JSON.parse(candidate)

      // Check if this looks complete (has expected fields for code question)
      if (parsed.type === 'code' && parsed.payload?.hidden_tests?.length > 0) {
        console.log('Successfully extracted complete JSON')
        return candidate
      }

      // Save as best attempt if we found valid JSON
      if (!bestCandidate) {
        bestCandidate = candidate
      }
    } catch (e) {
      bestError = e
      // Continue trying
    }
  }

  // If we found partial but valid JSON, it might be truncated
  if (bestCandidate) {
    console.warn('Found valid JSON but may be truncated (missing fields)')
    return bestCandidate
  }

  // If we get here, the response was invalid
  console.error('Failed to extract JSON. Response preview:', trimmed.substring(0, 500))
  throw new Error(`Could not extract valid JSON from response`)
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
  customPrompt?: string,
  specificSubtopic?: string
): Promise<GeneratedMCQ> {
  const systemPrompt = `You are an expert computer science educator creating questions for an adaptive coding platform called iteratr.
${adaptiveContext ? `MENTOR CONTEXT:\n${adaptiveContext}` : ''}
Your goal is to generate challenging but fair questions that test REAL understanding, not trivia.
For wrong answer options (distractors), always base them on ACTUAL misconceptions students have.
Never give away the answer in the question itself.
STRICT RULE: Do NOT use LaTeX math mode (e.g., $N$ or $i$) for variables. Use standard markdown backticks instead (e.g., \`N\` or \`i\`).
${customPrompt ? `Additional instructions from the user: ${customPrompt}` : ''}
${specificSubtopic ? `CRITICAL: You MUST use exactly this string for the 'subtopic' field: "${specificSubtopic}"` : ''}
You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`

  const prompt = `Generate a multiple choice question about: ${specificSubtopic || topic}
Target difficulty Elo: ${targetElo} (scale: 800=beginner, 1200=intermediate, 1600=advanced)

STRICT JSON format — return ONLY this:
{
  "type": "mcq",
  "topic": "${topic}",
  "subtopic": "${specificSubtopic || `specific subtopic within ${topic}`}",
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
- problem_statement must be clear and unambiguous
- CRITICAL: Ensure all newlines are escaped as \\n. All quotes must be escaped as \\"`

  try {
    const raw = await callGemini(prompt, systemPrompt)
    const json = extractJSON(raw)
    return MCQSchema.parse(JSON.parse(json)) as GeneratedMCQ
  } catch (error: any) {
    console.error('MCQ generation failed:', error.message)
    throw error
  }
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

import { searchKnowledge } from './vector'

export async function generateHint(req: HintRequest): Promise<{ hint: string, reasoning: string }> {
  const levelDescriptions = {
    1: 'Explain WHY the submitted code/answer is logically wrong. Do NOT point toward the correct solution. Focus on what conceptual gap caused the error.',
    2: 'Give a directional nudge toward the general concept they need. Do not name the exact approach or algorithm.',
    3: 'Give pseudocode structure or a concrete analogy. Do not write working code.',
    4: 'Give a complete explanation with annotated code. This is the final hint — be thorough.',
  }

  // 🔎 RAG: Search for relevant context in knowledge base
  const context = await searchKnowledge(req.problem_statement + ' ' + req.failed_test)
  const knowledgeContext = context.length > 0 
    ? `\n\n[RELEVANT KNOWLEDGE BASE CONTEXT]:\n${context.map(c => c.content).join('\n---\n')}`
    : ''

  const systemPrompt = `You are an agentic Socratic coding mentor. 
Your process is REASON -> ACT -> HINT.
1. REASON: Analyze the user's code, the failed test case, and the error output. Identify the EXACT conceptual gap.
2. ACT: Select the most helpful strategy for the requested hint level.
3. HINT: Generate the final hint text.
${knowledgeContext}

STRICT RULES:
- Never give the answer directly unless it's Level 4.
- At Level 1-3, a student should still have to think.
- Do NOT use LaTeX math mode ($N$). Use backticks (\`N\`).
- Return a JSON object with 'reasoning' and 'hint'.`

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

Current Level: ${req.hint_level}
Instruction for this level: ${levelDescriptions[req.hint_level]}

Return JSON:
{
  "reasoning": "Internal thought process analyzing why the user is wrong and what they missed",
  "hint": "The actual Socratic hint to show the user"
}`

  const raw = await callGemini(prompt, systemPrompt)
  const json = JSON.parse(extractJSON(raw))
  return {
    hint:      json.hint,
    reasoning: json.reasoning
  }
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
  customPrompt?: string,
  specificSubtopic?: string
): Promise<GeneratedFill> {
  const systemPrompt = `You are an expert computer science educator creating "Fill in the Blank" questions for iteratr.
${adaptiveContext ? `MENTOR CONTEXT:\n${adaptiveContext}` : ''}
Your goal is to choose blanks that reveal a conceptual gap, not syntax trivia.
Example: "A recursive function must have a ___ case to stop..." -> blank: "base".
Do NOT use LaTeX math mode ($N$). Use standard backticks (\`N\`).
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}
${specificSubtopic ? `CRITICAL: You MUST use exactly this string for the 'subtopic' field: "${specificSubtopic}"` : ''}
You MUST respond with valid JSON only.`

  const prompt = `Generate a Fill in the Blank question about: ${specificSubtopic || topic}
Target difficulty Elo: ${targetElo}

STRICT JSON format:
{
  "type": "fill",
  "topic": "${topic}",
  "subtopic": "${specificSubtopic || 'specific subtopic'}",
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
- hints must NEVER reveal the answers directly.
- CRITICAL: Ensure all newlines are escaped as \\n. All quotes must be escaped as \\"`

  try {
    const raw = await callGemini(prompt, systemPrompt)
    const json = extractJSON(raw)
    return FillSchema.parse(JSON.parse(json)) as GeneratedFill
  } catch (error: any) {
    console.error('Fill generation failed:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// DRAG TO ORDER GENERATION
// ─────────────────────────────────────────────────────────────

export async function generateOrder(
  topic: string,
  targetElo: number,
  adaptiveContext: string = '',
  customPrompt?: string,
  specificSubtopic?: string
): Promise<GeneratedOrder> {
  const systemPrompt = `You are an expert educator creating "Drag to Order" procedural questions for iteratr.
${adaptiveContext ? `MENTOR CONTEXT:\n${adaptiveContext}` : ''}
Your goal is to test sequential understanding (e.g. algorithms, system flows, OS boot sequences).
STRICT RULE: Do NOT use LaTeX math mode ($N$). Use backticks (\`N\`).
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}
${specificSubtopic ? `CRITICAL: You MUST use exactly this string for the 'subtopic' field: "${specificSubtopic}"` : ''}
You MUST respond with valid JSON only.`

  const prompt = `Generate a Drag to Order question about: ${specificSubtopic || topic} (focus on a procedure or process)
Target difficulty Elo: ${targetElo}

STRICT JSON format:
{
  "type": "order",
  "topic": "${topic}",
  "subtopic": "${specificSubtopic || 'specific specific subtopic'}",
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
- steps must be clearly distinct and sequential.
- CRITICAL: Ensure all newlines are escaped as \\n. All quotes must be escaped as \\"`

  try {
    const raw = await callGemini(prompt, systemPrompt)
    const json = extractJSON(raw)
    return OrderSchema.parse(JSON.parse(json)) as GeneratedOrder
  } catch (error: any) {
    console.error('Order generation failed:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// CODE SPACE GENERATION
// ─────────────────────────────────────────────────────────────

export async function generateCodeSpace(
  topic: string,
  targetElo: number,
  language: 'python' | 'cpp' | 'javascript' = 'cpp',
  adaptiveContext: string = '',
  customPrompt?: string,
  specificSubtopic?: string,
  retryCount: number = 0
): Promise<GeneratedCode> {
  const systemPrompt = `You are a Senior Software Engineer creating coding challenges for iteratr.
Your goal is to test logic and algorithm implementation.

CRITICAL: Respond with ONLY valid JSON. No markdown, text, or explanations.`

  const prompt = `Generate a coding challenge in ${language} about ${topic}.
Respond with ONLY this JSON structure (no other text):
{
  "type": "code",
  "topic": "${topic}",
  "subtopic": "specific aspect",
  "difficulty_elo": ${targetElo},
  "problem_statement": "Clear problem description",
  "payload": {
    "language": "${language}",
    "scaffold": "function skeleton",
    "hidden_tests": [
      {"input": "test", "expected_output": "result", "description": "case"}
    ],
    "solution": "complete solution"
  },
  "hints": ["hint1", "hint2", "hint3", "hint4"],
  "explanation": "why solution works",
  "tags": ["tag1", "tag2"]
}`

  try {
    const raw = await callGemini(prompt, systemPrompt)
    const json = extractJSON(raw)
    return CodeSchema.parse(JSON.parse(json)) as GeneratedCode
  } catch (error: any) {
    if (retryCount < 2) {
      console.warn(`Code generation attempt ${retryCount + 1} failed, retrying:`, error.message)
      // Exponential backoff: 1s, then 2s
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
      return generateCodeSpace(topic, targetElo, language, adaptiveContext, customPrompt, specificSubtopic, retryCount + 1)
    }
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// DYNAMIC I/O DRIVER GENERATION
// ─────────────────────────────────────────────────────────────

export async function generateIoDriver(
  userCode: string,
  language: string,
  sampleTest: { input: string, expected_output: string }
): Promise<string> {
  const prompt = `You are an I/O test driver generator for a coding platform.
The user wrote this ${language} code:
\`\`\`${language}
${userCode}
\`\`\`

We will execute this code on Judge0 and pass test inputs via standard input (stdin).
Sample STDIN input:
${sampleTest.input}

Sample expected STDOUT:
${sampleTest.expected_output}

Generate ONLY the exact driver code (e.g., \`int main() { ... }\` for C++, \`if __name__ == '__main__': ...\` for Python, or direct function calls for JS) that will:
1. Read the input from STDIN (using \`cin\`, \`sys.stdin.read\`, or \`fs.readFileSync(0, 'utf-8')\`).
2. Parse the STDIN text into the exact data types expected by the user's function.
   - For C/C++, if an input looks like an array (e.g., \`[1, 2, 3]\`), write robust logic to ignore or replace brackets \`[\`, \`]\` and commas \`,\` before streaming them into a vector!! Use string or char replacement logic.
3. Call the user's function/method.
4. Print the result directly to STDOUT exactly matching the 'Sample expected STDOUT' format (including brackets/commas if expected in the output).

CRITICAL RULES:
- Output ONLY valid executable ${language} code. No explanations. No markdown blocks like \`\`\`cpp.
- Do NOT rewrite or include any of the user's code. Just provide the driver code to append at the bottom.
- Ensure all types perfectly match the user's function signature.
- Only construct the class if necessary (e.g. \`Solution sol;\`).`

  const raw = await callGemini(prompt, 'You are a code execution driver generator. Output raw code only without markdown.')
  return raw.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '').trim()
}

// ─────────────────────────────────────────────────────────────
// CODE EVALUATION
// ─────────────────────────────────────────────────────────────

export async function evaluateCode(
  problem: string,
  userCode: string,
  language: string,
  executionResults: import('./judge0').Judge0CaseResult[],
  isDriverGenerated: boolean = false
): Promise<{ isCorrect: boolean, feedback: string }> {

  // 1. Check if execution was "meaningful" (produced output or had errors)
  const hasExecutionOutput = executionResults.some(r => r.actual_output.length > 0 || r.stderr || (r.status !== 'Accepted' && r.status !== 'Unknown'))
  const allPassed = executionResults.length > 0 && executionResults.every(r => r.passed)
  const hadNetworkError = executionResults.some(r => r.status === 'Network Error / Timeout')

  // If Judge0 definitively passed all tests and actually produced output
  if (allPassed && hasExecutionOutput && !hadNetworkError) {
    return { isCorrect: true, feedback: 'All test cases passed successfully! Optimal solution.' }
  }

  // If Judge0 definitively failed tests and the driver was NOT dynamically generated by AI, rust it locally.
  if (!allPassed && hasExecutionOutput && !hadNetworkError && !isDriverGenerated) {
    const failedTest = executionResults.find(r => !r.passed)
    let errorFeedback = 'Your code failed one or more test cases.'
    if (failedTest) {
      if (failedTest.compile_output) {
        errorFeedback = `Compilation Error:\n${failedTest.compile_output}`
      } else if (failedTest.stderr) {
        errorFeedback = `Runtime Error:\n${failedTest.stderr}`
      } else {
        errorFeedback = `Test Case Failed (${failedTest.description}).\nExpected: ${failedTest.expected_output}\nGot: ${failedTest.actual_output}`
      }
    }
    return { isCorrect: false, feedback: errorFeedback }
  }

  // 2. Use Gemini for final feedback and logic verification ONLY if:
  // - There was a Network Error / Timeout
  // - OR tests "Passed" but produced NO actual output (likely due to missing driver/main function)
  // - OR the tests "Failed" but they were run with an AI-generated dynamic driver, which means the parsing could be buggy!
  const systemPrompt = `You are a Senior Engineer acting as a final logical verifier. 
  Assess the student's code logic for correctness against the problem statement.
  
  JUDGE0 CONTEXT:
  - If results show "Network Error", perform a deep STATIC ANALYSIS.
  - If the code was executed with an AI-generated driver and failed (actual output didn't match), the dynamic input parser may have corrupted the test case! Check if the user's algorithmic logic is fundamentally sound. If it is flawlessly correct, mark it as true.
  
  Respond ONLY with JSON: { "isCorrect": boolean, "feedback": "2-3 sentences explaining success or failure" }`

  const prompt = `Problem: ${problem}
  Language: ${language}
  User Code: ${userCode}
  JUDGE0_RESULTS: ${JSON.stringify(executionResults)}
  Driver Was Generated Dynamically: ${isDriverGenerated}
  
  ANALYSIS INSTRUCTIONS:
  1. If there's a Network Error / Timeout, ignore Judge0 and statically verify logic.
  2. If 'Driver Was Generated Dynamically' is true and the tests failed, intensely evaluate the user's algorithmic logic. If their logic perfectly matches standard optimal solutions (like DEQUE for Sliding Window O(N)), mark it as correct regardless of Judge0's actual output, as the dynamic IO parser likely fed it empty arrays. 
  3. If there are crystal clear syntax errors inside the user's code, mark as incorrect.
  
  Is this solution logically correct?`

  const raw = await callGemini(prompt, systemPrompt)
  try {
    const json = JSON.parse(extractJSON(raw))
    return {
      isCorrect: json.isCorrect ?? false,
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
  style: string = 'neutral',
  memoryContext: string = ''
): Promise<string> {
  const styles: Record<string, string> = {
    friendly: "You are a warm, encouraging mentor. You nudge them with kindness and analogies.",
    neutral:  "You are a professional, efficient interviewer. You are fair but direct.",
    strict:   "You are an intimidating, high-pressure FAANG interviewer. You ask critical follow-up questions about space/time complexity even for minor parts."
  }

  const systemPrompt = `You are a Senior Technical Interviewer at a top-tier tech company. 
  ${styles[style] || styles.neutral}
  ${memoryContext ? `\n\n[HISTORICAL MEMORY]: ${memoryContext}` : ''}
  
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
// SILENT GRADER AGENT (Phase 3)
// ─────────────────────────────────────────────────────────────

export async function generateSilentGraderFeedback(
  problem: string,
  history: InterviewMessage[],
  userCode: string
): Promise<string> {
  const systemPrompt = `You are the "Silent Grader" agent. You run invisibly in the background.
Your job is to monitor the candidate's communication, logic, and problem-solving approach.
You do NOT speak to the candidate. You write brief, clinical observations for the database.
Focus on:
1. Did they explain their complexity?
2. Did they miss an edge case initially?
3. Is their communication clear or scattered?
Keep it to 2-3 bullet points.`

  const conversationText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')

  const prompt = `
PROBLEM: ${problem}
CURRENT CODE:
\`\`\`
${userCode}
\`\`\`
HISTORY:
${conversationText}

Analyze the candidate's performance so far and write your internal grading notes.`

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
