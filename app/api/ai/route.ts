import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import {
  buildEmailPrompt,
  buildMeetingPrompt,
  buildPlannerPrompt,
  buildResearchPrompt,
  buildWorkspacePrompt,
  SYSTEM_PROMPTS,
} from '@/lib/prompts'

export const maxDuration = 60

const MODEL = 'claude-sonnet-5'

const priority = z.enum(['High', 'Medium', 'Low'])

// ---- Input validation schemas --------------------------------------------

const emailInput = z.object({
  recipientName: z.string().optional(),
  audience: z.enum(['Manager', 'Client', 'Colleague', 'Team', 'External Partner', 'Other']),
  purpose: z.string().min(1),
  keyFacts: z.string().min(1),
  tone: z.enum(['Formal', 'Friendly', 'Persuasive', 'Concise']),
  senderName: z.string().optional(),
})

const meetingInput = z.object({
  title: z.string().min(1),
  date: z.string().optional(),
  attendees: z.string().optional(),
  notes: z.string().min(1),
})

const plannerInput = z.object({
  tasks: z
    .array(
      z.object({
        name: z.string().min(1),
        deadline: z.string().optional(),
        priority: priority,
        estimatedDuration: z.string().optional(),
      }),
    )
    .min(1),
  workingHours: z.string().min(1),
  fixedCommitments: z.string().optional(),
})

const researchInput = z.object({
  topic: z.string().min(1),
  intendedUse: z.string().min(1),
  depth: z.enum(['Quick Overview', 'Standard Brief', 'Detailed Brief']),
  sourceMaterial: z.string().optional(),
})

const workspaceInput = z.object({
  input: z.string().min(1),
})

// ---- Output schemas (what Claude must return) -----------------------------

const emailOutput = z.object({
  subject: z.string(),
  body: z.string(),
})

const meetingOutput = z.object({
  overview: z.string(),
  discussionPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(z.object({ task: z.string(), owner: z.string(), deadline: z.string() })),
  ambiguities: z.array(z.string()),
})

const plannerOutput = z.object({
  schedule: z.array(z.object({ timeBlock: z.string(), task: z.string(), priority })),
  priorityExplanation: z.string(),
  workloadRisks: z.string(),
  optimizationSuggestions: z.array(z.string()),
  clarifications: z.array(z.string()),
  overloaded: z.boolean(),
  overloadWarning: z.string(),
})

const researchOutput = z.object({
  topic: z.string(),
  executiveSummary: z.string(),
  keyInsights: z.array(z.string()),
  considerations: z.array(z.string()),
  recommendation: z.string(),
  sourceBasis: z.enum([
    'User-supplied material',
    'General AI knowledge — independently verify important claims',
  ]),
})

const workspaceOutput = z.object({
  emails: z.array(z.object({ summary: z.string(), recipient: z.string(), purpose: z.string() })),
  tasks: z.array(z.object({ task: z.string(), deadline: z.string(), priority })),
  meetings: z.array(z.object({ summary: z.string(), with: z.string(), when: z.string() })),
  research: z.array(z.object({ question: z.string(), context: z.string() })),
  missingInfo: z.array(z.string()),
})

type FeatureConfig = {
  system: string
  parseInput: (raw: unknown) => { prompt: string }
  schema: z.ZodTypeAny
}

const FEATURES: Record<string, FeatureConfig> = {
  email: {
    system: SYSTEM_PROMPTS.email,
    parseInput: (raw) => ({ prompt: buildEmailPrompt(emailInput.parse(raw)) }),
    schema: emailOutput,
  },
  meeting: {
    system: SYSTEM_PROMPTS.meeting,
    parseInput: (raw) => ({ prompt: buildMeetingPrompt(meetingInput.parse(raw)) }),
    schema: meetingOutput,
  },
  planner: {
    system: SYSTEM_PROMPTS.planner,
    parseInput: (raw) => ({ prompt: buildPlannerPrompt(plannerInput.parse(raw)) }),
    schema: plannerOutput,
  },
  research: {
    system: SYSTEM_PROMPTS.research,
    parseInput: (raw) => ({ prompt: buildResearchPrompt(researchInput.parse(raw)) }),
    schema: researchOutput,
  },
  workspace: {
    system: SYSTEM_PROMPTS.workspace,
    parseInput: (raw) => ({ prompt: buildWorkspacePrompt(workspaceInput.parse(raw)) }),
    schema: workspaceOutput,
  },
}

export async function POST(req: Request) {
  // Fail clearly (but without leaking internals) if the key is not configured.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'The AI service is not configured. Add ANTHROPIC_API_KEY to enable AI features.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { feature, input } = (body ?? {}) as { feature?: string; input?: unknown }

  if (!feature || typeof feature !== 'string' || !(feature in FEATURES)) {
    return Response.json({ error: 'Unknown or missing feature.' }, { status: 400 })
  }

  const config = FEATURES[feature]

  let prompt: string
  try {
    prompt = config.parseInput(input).prompt
  } catch {
    return Response.json(
      { error: 'Some required information is missing or invalid. Please review the form.' },
      { status: 422 },
    )
  }

  try {
    const { object } = await generateObject({
      model: anthropic(MODEL),
      schema: config.schema,
      system: config.system,
      prompt,
    })
    return Response.json({ data: object })
  } catch (err) {
    // Never leak environment or stack details to the client.
    console.log('[v0] /api/ai generation error:', err instanceof Error ? err.message : err)
    return Response.json(
      { error: 'The AI service could not complete this request. Please try again.' },
      { status: 502 },
    )
  }
}
