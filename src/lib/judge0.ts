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
  stderr?: string
  compile_output?: string
}

function getJudge0Config() {
  const apiKey = process.env.JUDGE0_API_KEY
  const apiUrl = process.env.JUDGE0_API_URL || 'https://ce.judge0.com'
  return { apiKey, apiUrl }
}

/**
 * Judge0 Timeout Strategy:
 * - 15-second timeout per attempt (increased from 6s to handle public API latency)
 * - 1 retry on failure (reduced from 2 to avoid cascading requests)
 * - Public Judge0 API can be slow/overloaded; paid tier is much faster
 * - If timeout occurs, AI verification is used as fallback
 */

function encodeBase64(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64')
}

function decodeBase64(str: string | null | undefined): string {
  if (!str) return ''
  return Buffer.from(str, 'base64').toString('utf8')
}

function wrapCodeForExecution(sourceCode: string, language: string): string {
  const lang = language.toLowerCase()
  if (lang === 'cpp') {
    const hasMain = sourceCode.includes('int main');
    const mainTemplate = hasMain ? '' : `\nint main() {\n    return 0;\n}\n`;

    return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <stack>
#include <map>
#include <set>
#include <climits>
#include <sstream>

using namespace std;

/**
 * Common data structures for LeetCode-style questions
 */
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

${sourceCode}
${mainTemplate}
`
  }

  if (lang === 'python') {
    return `
import sys
import math
import collections
import heapq
import bisect
import itertools
import json

${sourceCode}
`
  }

  return sourceCode
}

export async function runOnJudge0(
  sourceCode: string,
  language: string,
  stdin?: string,
  retries = 1
): Promise<Judge0RunResult | null> {
  const { apiKey, apiUrl } = getJudge0Config()

  // Normalize language name to lowercase for mapping
  const normalizedLang = language.toLowerCase() as SupportedLanguage
  const languageId = LANG_MAP[normalizedLang] || LANG_MAP.python

  const wrappedCode = wrapCodeForExecution(sourceCode, language)

  // Increased timeout to 15 seconds per attempt to handle overloaded public API
  // The public Judge0 API can be slow, so we give it more time
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['X-Auth-Token'] = apiKey
    }

    const res = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: encodeBase64(wrappedCode),
        language_id: languageId,
        stdin: encodeBase64(stdin || ''),
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text()
      console.error(`[Judge0] API Error ${res.status}: ${text}`)
      return null
    }
    const json = await res.json()
    return {
      stdout: decodeBase64(json.stdout),
      stderr: decodeBase64(json.stderr),
      status: json.status?.description || 'Unknown',
      compile_output: decodeBase64(json.compile_output),
      time: json.time?.toString(),
      memory: json.memory,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (retries > 0) {
      const reason = error.name === 'AbortError' ? 'Timeout' : error.message
      console.warn(`[Judge0] Attempt failed (${reason}). Retrying... (${retries} left).`)
      // Wait a bit before retrying to avoid hammering the API
      await new Promise(r => setTimeout(r, 1200))
      return runOnJudge0(sourceCode, language, stdin, retries - 1)
    }
    console.error(`[Judge0] Final fetch exception:`, error)
    return null
  }
}

export async function runAgainstHiddenTests(
  sourceCode: string,
  language: string,
  hiddenTests: Judge0TestCase[]
): Promise<Judge0CaseResult[]> {
  // Use Promise.all to run all test cases in parallel for better performance and to avoid timeouts
  const testPromises = hiddenTests.map(async (test) => {
    const run = await runOnJudge0(sourceCode, language, test.input)
    
    if (!run) {
      // Return a special error result instead of skipping
      return {
        input: test.input,
        expected_output: (test.expected_output || '').trim(),
        actual_output: '',
        passed: false,
        status: 'Network Error / Timeout',
        description: test.description,
        stderr: 'The request to Judge0 timed out or failed. This usually happens when the public API is busy or the code execution took too long.',
      }
    }

    const actual = (run.stdout || '').trim()
    const expected = (test.expected_output || '').trim()
    
    // SMART COMPARISON: Handle [1,2,3] vs 1 2 3 vs [1, 2, 3]
    const normalize = (s: string) => s.replace(/[\[\],]/g, ' ').replace(/\s+/g, ' ').trim()
    const isPassed = actual === expected || normalize(actual) === normalize(expected)
    
    return {
      input: test.input,
      expected_output: expected,
      actual_output: actual,
      passed: isPassed,
      status: run.status || 'Unknown',
      description: test.description,
      stderr: run.stderr,
      compile_output: run.compile_output,
    }
  })

  return await Promise.all(testPromises)
}

