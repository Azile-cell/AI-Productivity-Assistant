import type { FeatureContract } from './types'
import {
  generateEmail,
  organizeWorkspace,
  planTasks,
  researchBrief,
  summarizeMeeting,
} from './local-engine'

// Local, deterministic demo engine. No external API, API key, billing account,
// network request, or server-side AI service is required.
export async function runFeature<K extends keyof FeatureContract>(
  feature: K,
  input: FeatureContract[K]['input'],
): Promise<FeatureContract[K]['output']> {
  await new Promise((resolve) => setTimeout(resolve, 250))

  switch (feature) {
    case 'email':
      return generateEmail(input as FeatureContract['email']['input']) as FeatureContract[K]['output']
    case 'meeting':
      return summarizeMeeting(input as FeatureContract['meeting']['input']) as FeatureContract[K]['output']
    case 'planner':
      return planTasks(input as FeatureContract['planner']['input']) as FeatureContract[K]['output']
    case 'research':
      return researchBrief(input as FeatureContract['research']['input']) as FeatureContract[K]['output']
    case 'workspace':
      return organizeWorkspace(input as FeatureContract['workspace']['input']) as FeatureContract[K]['output']
    default:
      throw new Error('Unknown feature.')
  }
}
