import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { SYSTEM_PROMPTS } from '@/lib/prompts'

export const maxDuration = 60

const MODEL = 'claude-sonnet-5'

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'The AI service is not configured. Add ANTHROPIC_API_KEY to enable the chatbot.' },
      { status: 503 },
    )
  }

  let messages: UIMessage[]
  try {
    const body = await req.json()
    messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return Response.json({ error: 'Invalid conversation payload.' }, { status: 422 })
    }
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    const result = streamText({
      model: anthropic(MODEL),
      system: SYSTEM_PROMPTS.chatbot,
      messages: await convertToModelMessages(messages),
    })
    return result.toUIMessageStreamResponse()
  } catch (err) {
    console.log('[v0] /api/chat error:', err instanceof Error ? err.message : err)
    return Response.json(
      { error: 'The assistant is unavailable right now. Please try again.' },
      { status: 502 },
    )
  }
}
