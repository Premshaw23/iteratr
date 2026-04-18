import { z } from 'zod'

export const MCQSchema = z.object({
  type:              z.literal('mcq'),
  topic:             z.string(),
  subtopic:          z.string(),
  difficulty_elo:    z.number(),
  problem_statement: z.string(),
  payload: z.object({
    options:            z.array(z.string()).length(4),
    correct_index:      z.number().min(0).max(3),
    distractor_reasons: z.array(z.string()).length(4),
  }),
  hints:       z.array(z.string()),
  explanation: z.string(),
  tags:        z.array(z.string()).optional().default([]),
})

export const FillSchema = z.object({
  type:              z.literal('fill'),
  topic:             z.string(),
  subtopic:          z.string(),
  difficulty_elo:    z.number(),
  problem_statement: z.string(),
  payload: z.object({
    blanks: z.array(z.object({
      answer:        z.string(),
      hint_if_wrong: z.string(),
    })),
  }),
  hints:       z.array(z.string()),
  explanation: z.string(),
  tags:        z.array(z.string()).optional().default([]),
})

export const OrderSchema = z.object({
  type:              z.literal('order'),
  topic:             z.string(),
  subtopic:          z.string(),
  difficulty_elo:    z.number(),
  problem_statement: z.string(),
  payload: z.object({
    steps:           z.array(z.string()),
    shuffled_steps:  z.array(z.string()),
  }),
  hints:       z.array(z.string()),
  explanation: z.string(),
  tags:        z.array(z.string()).optional().default([]),
})

export const CodeSchema = z.object({
  type:              z.literal('code'),
  topic:             z.string(),
  subtopic:          z.string(),
  difficulty_elo:    z.number(),
  problem_statement: z.string(),
  payload: z.object({
    language:        z.enum(['python', 'cpp', 'javascript']),
    scaffold:        z.string(),
    hidden_tests:    z.array(z.object({
      input:           z.string(),
      expected_output: z.string(),
      description:     z.string(),
    })),
    solution:        z.string(),
  }),
  hints:       z.array(z.string()),
  explanation: z.string(),
  tags:        z.array(z.string()).optional().default([]),
})

export const InterviewScorecardSchema = z.object({
  overall_score: z.number(),
  communication: z.object({ score: z.number(), feedback: z.string() }),
  logic:         z.object({ score: z.number(), feedback: z.string() }),
  optimization:  z.object({ score: z.number(), feedback: z.string() }),
  summary:       z.string(),
  hire_decision: z.enum(["Strong Hire", "Hire", "Leaning No Hire", "No Hire"]),
})
