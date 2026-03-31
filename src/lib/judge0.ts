type SupportedLanguage = 'python' | 'cpp' | 'javascript' | 'java'

const LANG_MAP: Record<SupportedLanguage, number> = {
  python: 71,
  cpp: 54,
  javascript: 63,
  java: 62,
}

export interface Judge0RunResult {
  stdout: string
  stderr: string
  status?: string
  compile_output?: string
  time?: string
  memory?: number
}

export interface Judge0TestCase {
  input: string
  expected_output: string
  description: string
}

export interface Judge0CaseResult {
  input: string
  expected_output: string
  actual_output: string
  passed: boolean
  status: string
  description: string
}

function getJudge0Config() {
  const apiKey = process.env.JUDGE0_API_KEY
  const apiUrl = process.env.JUDGE0_API_URL || 'https://ce.judge0.com'
  return { apiKey, apiUrl }
}

export async function runOnJudge0(
  sourceCode: string,
  language: string,
  stdin?: string
): Promise<Judge0RunResult | null> {
  const { apiKey, apiUrl } = getJudge0Config()
  const languageId = LANG_MAP[(language as SupportedLanguage)] || LANG_MAP.python

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['X-Auth-Token'] = apiKey
    }

    const res = await fetch(`${apiUrl}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || '',
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    return {
      stdout: (json.stdout || '').toString(),
      stderr: (json.stderr || '').toString(),
      status: json.status?.description || 'Unknown',
      compile_output: (json.compile_output || '').toString(),
      time: json.time?.toString(),
      memory: json.memory,
    }
  } catch {
    return null
  }
}

export async function runAgainstHiddenTests(
  sourceCode: string,
  language: string,
  hiddenTests: Judge0TestCase[]
): Promise<Judge0CaseResult[]> {
  const results: Judge0CaseResult[] = []

  for (const test of hiddenTests) {
    const run = await runOnJudge0(sourceCode, language, test.input)
    if (!run) continue

    const actual = (run.stdout || '').trim()
    const expected = (test.expected_output || '').trim()
    results.push({
      input: test.input,
      expected_output: expected,
      actual_output: actual,
      passed: actual === expected,
      status: run.status || 'Unknown',
      description: test.description,
    })
  }

  return results
}

