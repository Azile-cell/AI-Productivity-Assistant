import type { FeatureContract } from './types'

// Typed client for the secure /api/ai route. The API key never touches
// the client — this only sends the selected feature and user inputs.
export async function runFeature<K extends keyof FeatureContract>(
  feature: K,
  input: FeatureContract[K]['input'],
): Promise<FeatureContract[K]['output']> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature, input }),
  })

  let payload: { data?: FeatureContract[K]['output']; error?: string } = {}
  try {
    payload = await res.json()
  } catch {
    throw new Error('Unexpected response from the AI service.')
  }

  if (!res.ok || !payload.data) {
    throw new Error(payload.error || 'The AI service could not complete this request.')
  }

  return payload.data
}
