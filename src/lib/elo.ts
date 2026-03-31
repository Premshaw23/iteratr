// ─────────────────────────────────────────────────────────────
// iteratr — Elo Rating Engine
// Pure functions — no DB calls, fully testable
// ─────────────────────────────────────────────────────────────

export interface EloInput {
  userElo:      number
  questionElo:  number
  isCorrect:    boolean
  hintsUsed:    number  // 0-4
  timeTaken:    number  // seconds
  timeLimit:    number  // seconds (0 = no limit)
  streakCount:  number  // current streak
}

export interface EloResult {
  change:  number
  newElo:  number
  reason:  string
}

// Expected score based on Elo difference (standard chess formula)
function expectedScore(userElo: number, questionElo: number): number {
  return 1 / (1 + Math.pow(10, (questionElo - userElo) / 400))
}

export function calculateEloChange(input: EloInput): EloResult {
  const { userElo, questionElo, isCorrect, hintsUsed, timeTaken, timeLimit, streakCount } = input

  const expected = expectedScore(userElo, questionElo)
  const K = 32 // K-factor — how much each question can move rating

  let change: number
  let reason: string
  let streakMultiplier = 1

  if (isCorrect) {
    // Base change from Elo formula
    const base = Math.round(K * (1 - expected))

    // Hint penalty
    const hintPenalty = hintsUsed === 0 ? 0
      : hintsUsed === 1 ? Math.round(base * 0.3)
      : hintsUsed === 2 ? Math.round(base * 0.5)
      : hintsUsed >= 3  ? Math.round(base * 0.7)
      : 0

    // Time bonus/penalty (only if time limit is set)
    let timeModifier = 0
    if (timeLimit > 0) {
      const timeRatio = timeTaken / timeLimit
      if (timeRatio < 0.5)      timeModifier = 4   // Fast — bonus
      else if (timeRatio > 0.9) timeModifier = -3  // Slow — small penalty
    }

    change = Math.max(1, base - hintPenalty + timeModifier)

    // Apply streak multiplier (1.1x, 1.2x, ..., up to 1.5x)
    if (streakCount > 0) {
      streakMultiplier = Math.min(1.5, 1 + (streakCount * 0.1))
      change = Math.round(change * streakMultiplier)
    }

    const streakTag = streakMultiplier > 1 ? `, streak x${streakMultiplier.toFixed(1)}` : ''
    reason = hintsUsed === 0
      ? `Correct, no hints${timeModifier > 0 ? ', fast' : ''}${streakTag}`
      : `Correct, ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used${streakTag}`

  } else {
    // Wrong — lose points based on how easy the question was relative to user
    const base = Math.round(K * expected)

    // More hints used on a wrong answer = bigger penalty
    const hintExtra = hintsUsed >= 3 ? 4 : 0

    change = -Math.max(2, base + hintExtra)
    reason = hintsUsed >= 4
      ? 'Incorrect after all hints'
      : `Incorrect${hintsUsed > 0 ? `, ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used` : ''}`
  }

  // Hard clamp — rating can't drop below 400 or exceed 3000
  const newElo = Math.min(3000, Math.max(400, userElo + change))
  const actualChange = newElo - userElo

  return { change: actualChange, newElo, reason }
}

// ── Difficulty bands ──────────────────────────────────────────
export function getDifficultyLabel(elo: number): string {
  if (elo < 1000) return 'Foundation'
  if (elo < 1200) return 'Core DSA'
  if (elo < 1400) return 'Intermediate'
  if (elo < 1600) return 'Advanced'
  if (elo < 1800) return 'Expert'
  return 'FAANG-level'
}

// ── Next question Elo target ──────────────────────────────────
// Slightly above user's current rating for maximum learning
export function getTargetQuestionElo(userElo: number): number {
  return Math.round(userElo + 50 + Math.random() * 100)
}
