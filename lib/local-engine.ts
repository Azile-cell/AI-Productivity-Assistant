import type {
  EmailRequest,
  EmailResult,
  MeetingRequest,
  MeetingResult,
  PlannerRequest,
  PlannerResult,
  ResearchRequest,
  ResearchResult,
  TaskPriority,
  WorkspaceRequest,
  WorkspaceResult,
} from './types'

function clean(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function sentences(text: string): string[] {
  return text
    .split(/(?:\r?\n)+|(?<=[.!?])\s+/)
    .map((s) => clean(s.replace(/^[-•*]\s*/, '')))
    .filter(Boolean)
}

function titleFromPurpose(purpose: string) {
  const t = clean(purpose).replace(/[.!?]+$/, '')
  return t.length > 72 ? `${t.slice(0, 69)}...` : t || 'Workplace update'
}

export function generateEmail(r: EmailRequest): EmailResult {
  const recipient = clean(r.recipientName || '') || '[RECIPIENT NAME]'
  const sender = clean(r.senderName || '') || '[YOUR NAME]'
  const purpose = clean(r.purpose)
  const facts = sentences(r.keyFacts)
  const detailBlock = facts.length ? facts.map((f) => `- ${f}`).join('\n') : '- [SPECIFIC DETAIL]'

  const greeting = r.tone === 'Friendly' ? `Hi ${recipient},` : `Dear ${recipient},`
  const opener =
    r.tone === 'Persuasive'
      ? `I’m writing regarding ${purpose}. I’d like to outline the key points clearly so we can agree on the next step.`
      : r.tone === 'Concise'
        ? `I’m writing regarding ${purpose}.`
        : r.tone === 'Friendly'
          ? `I hope you’re well. I’m reaching out regarding ${purpose}.`
          : `I am writing regarding ${purpose}.`

  const closing =
    r.tone === 'Persuasive'
      ? 'Please let me know whether this approach works for you, or if you would prefer an alternative.'
      : 'Please let me know if you need any further information.'

  return {
    subject: titleFromPurpose(purpose),
    body: `${greeting}\n\n${opener}\n\nKey details:\n${detailBlock}\n\n${closing}\n\nKind regards,\n${sender}`,
  }
}

function deadlineFrom(text: string): string {
  const patterns = [
    /\b(by\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
    /\b((?:today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)))\b/i,
    /\b(by\s+\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i,
    /\b(\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?)\b/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  return 'Not specified'
}

function ownerFrom(text: string): string {
  const m = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:will|to|must|should|needs? to)\b/)
  return m?.[1] || 'Not specified'
}

export function summarizeMeeting(r: MeetingRequest): MeetingResult {
  const parts = sentences(r.notes)
  const decisionWords = /\b(agreed|decided|approved|confirmed|resolved|postponed|selected|chose)\b/i
  const actionWords = /\b(will|must|needs? to|should|follow up|prepare|send|finish|complete|review|confirm|schedule|book|draft|update)\b/i

  const decisions = parts.filter((s) => decisionWords.test(s))
  const actionSentences = parts.filter((s) => actionWords.test(s))
  const actionItems = actionSentences.map((s) => ({
    task: s.replace(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will\s+/i, '').replace(/[.]+$/, ''),
    owner: ownerFrom(s),
    deadline: deadlineFrom(s),
  }))

  const ambiguities: string[] = []
  actionItems.forEach((a) => {
    if (a.owner === 'Not specified') ambiguities.push(`Owner not specified for: ${a.task}`)
    if (a.deadline === 'Not specified') ambiguities.push(`Deadline not specified for: ${a.task}`)
  })

  return {
    overview: parts.length
      ? `${r.title || 'Meeting'} covered ${Math.min(parts.length, 5)} main point${parts.length === 1 ? '' : 's'}. This summary only reflects the notes entered by the user.`
      : 'No meeting notes were supplied.',
    discussionPoints: parts.slice(0, 8),
    decisions: decisions.length ? decisions : ['No confirmed decisions identified.'],
    actionItems,
    ambiguities: Array.from(new Set(ambiguities)).slice(0, 8),
  }
}

function minutesFromDuration(text?: string): number | null {
  if (!text) return null
  const h = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour)/i)
  const m = text.match(/(\d+)\s*(?:m|min|minute)/i)
  let total = 0
  if (h) total += Math.round(Number(h[1]) * 60)
  if (m) total += Number(m[1])
  return total || null
}

function parseWorkingWindow(text: string): { start: number; end: number } {
  const matches = [...text.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi)]
  if (matches.length >= 2) {
    const toMin = (m: RegExpMatchArray) => {
      let h = Number(m[1])
      const min = Number(m[2] || 0)
      const ap = m[3]?.toLowerCase()
      if (ap === 'pm' && h < 12) h += 12
      if (ap === 'am' && h === 12) h = 0
      return h * 60 + min
    }
    const start = toMin(matches[0])
    const end = toMin(matches[1])
    if (end > start) return { start, end }
  }
  return { start: 9 * 60, end: 17 * 60 }
}

function fmt(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const priorityScore: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 }

export function planTasks(r: PlannerRequest): PlannerResult {
  const window = parseWorkingWindow(r.workingHours)
  const available = window.end - window.start
  const sorted = [...r.tasks].sort((a, b) => {
    const dp = priorityScore[b.priority] - priorityScore[a.priority]
    if (dp) return dp
    return Number(Boolean(b.deadline)) - Number(Boolean(a.deadline))
  })

  const durations = sorted.map((t) => minutesFromDuration(t.estimatedDuration) ?? 60)
  const total = durations.reduce((a, b) => a + b, 0) + Math.max(0, sorted.length - 1) * 10
  const overloaded = total > available
  const schedule = [] as PlannerResult['schedule']
  let cursor = window.start

  sorted.forEach((t, i) => {
    const duration = durations[i]
    const end = Math.min(cursor + duration, window.end)
    if (cursor < window.end) {
      schedule.push({
        timeBlock: `${fmt(cursor)}–${fmt(end)}`,
        task: `${t.name}${t.estimatedDuration ? '' : ' (60 min planning estimate)'}`,
        priority: t.priority,
      })
    }
    cursor = end + 10
  })

  const clarifications = sorted
    .filter((t) => !t.deadline || !t.estimatedDuration)
    .map((t) => `${t.name}: ${!t.deadline ? 'deadline' : ''}${!t.deadline && !t.estimatedDuration ? ' and ' : ''}${!t.estimatedDuration ? 'duration' : ''} not specified.`)

  return {
    schedule,
    priorityExplanation: 'Tasks are ordered by stated priority first, then by whether a deadline was supplied. No deadline or priority has been invented.',
    workloadRisks: overloaded
      ? 'The entered work does not fit inside the available working window using the supplied or clearly labelled planning estimates.'
      : r.fixedCommitments
        ? `The draft schedule does not automatically parse every fixed commitment. Review it against: ${r.fixedCommitments}`
        : 'No obvious overload was detected from the entered task durations and working window.',
    optimizationSuggestions: [
      'Confirm missing deadlines before committing to the plan.',
      'Adjust the labelled planning estimates to match your real pace.',
      'Keep a short buffer between high-focus tasks and fixed commitments.',
    ],
    clarifications,
    overloaded,
    overloadWarning: overloaded
      ? `Estimated workload is about ${Math.ceil(total / 60)} hours, while the parsed working window provides about ${Math.round((available / 60) * 10) / 10} hours.`
      : '',
  }
}

function sourceSentences(text: string, max = 8) {
  return sentences(text).slice(0, max)
}

export function researchBrief(r: ResearchRequest): ResearchResult {
  const source = clean(r.sourceMaterial || '')
  if (source) {
    const points = sourceSentences(source, r.depth === 'Detailed Brief' ? 8 : r.depth === 'Standard Brief' ? 5 : 3)
    return {
      topic: r.topic,
      executiveSummary: points.slice(0, 2).join(' ') || 'The supplied source did not contain enough readable text to summarize.',
      keyInsights: points.length ? points : ['No clear insights could be extracted from the supplied material.'],
      considerations: [
        'This brief is derived only from the text you supplied; it does not verify the source independently.',
        'Check dates, figures, quotations and context against the original source before using them.',
      ],
      recommendation: `For ${r.intendedUse}, review the extracted points above, identify which claims need evidence, and verify those claims in the original material before presenting or acting on them.`,
      sourceBasis: 'User-supplied material',
    }
  }

  return {
    topic: r.topic,
    executiveSummary: 'No source material was supplied, and this no-API version does not browse the web or generate unsupported research claims.',
    keyInsights: [
      `Define the exact question you need answered about “${r.topic}”.`,
      'Collect at least two credible sources relevant to the intended workplace use.',
      'Compare evidence, dates, assumptions and disagreements across the sources.',
      'Paste the source material here to create a grounded brief without external APIs.',
    ],
    considerations: [
      'No factual claims about the topic are generated without supplied evidence.',
      'Use current, authoritative sources for decisions that depend on changing information.',
    ],
    recommendation: `For ${r.intendedUse}, gather reliable source material first, then paste it into this tool so the brief stays evidence-based.`,
    sourceBasis: 'No external source — research framework only',
  }
}

function recipientFrom(text: string): string {
  const patterns = [
    /(?:reply|email|send|write)\s+(?:to\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  return 'Not specified'
}

function meetingWith(text: string): string {
  const m = text.match(/\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
  return m?.[1] || 'Not specified'
}

function priorityFrom(text: string): TaskPriority {
  if (/\b(high priority|urgent|asap|critical)\b/i.test(text)) return 'High'
  if (/\b(low priority|when possible|nice to have)\b/i.test(text)) return 'Low'
  return 'Medium'
}

export function organizeWorkspace(r: WorkspaceRequest): WorkspaceResult {
  const items = sentences(r.input)
  const result: WorkspaceResult = { emails: [], tasks: [], meetings: [], research: [], missingInfo: [] }

  for (const raw of items) {
    const s = clean(raw)
    const lower = s.toLowerCase()

    if (/\b(reply|email|send|write|follow up)\b/.test(lower) && !/\bmeeting\b/.test(lower)) {
      const recipient = recipientFrom(s)
      result.emails.push({ summary: s, recipient, purpose: s })
      if (recipient === 'Not specified') result.missingInfo.push(`Email recipient not specified: ${s}`)
      continue
    }

    if (/\b(meeting|meet|book|schedule|call|catch up)\b/.test(lower)) {
      const withPerson = meetingWith(s)
      const when = deadlineFrom(s)
      result.meetings.push({ summary: s, with: withPerson, when })
      if (withPerson === 'Not specified') result.missingInfo.push(`Meeting participant not specified: ${s}`)
      if (when === 'Not specified') result.missingInfo.push(`Meeting time/date not specified: ${s}`)
      continue
    }

    if (/\b(research|look into|find out|compare|investigate|learn about|whether)\b/.test(lower)) {
      result.research.push({ question: s, context: 'Workplace note requiring evidence or further research.' })
      continue
    }

    if (/\b(need to|must|finish|complete|prepare|review|update|submit|create|draft|fix|do)\b/.test(lower)) {
      const deadline = deadlineFrom(s)
      result.tasks.push({ task: s, deadline, priority: priorityFrom(s) })
      if (deadline === 'Not specified') result.missingInfo.push(`Task deadline not specified: ${s}`)
      continue
    }

    result.missingInfo.push(`Could not confidently classify: ${s}`)
  }

  return result
}

export function localChatReply(input: string): string {
  const q = clean(input)
  const lower = q.toLowerCase()
  if (/email|message|write|draft/.test(lower)) {
    return 'This request fits the Email Generator. Open Email Generator, choose the audience and tone, then provide the purpose and only the facts you want included. The local demo will create a structured draft without calling an external API.'
  }
  if (/meeting|minutes|notes|summary|summar/.test(lower)) {
    return 'This request fits the Meeting Summarizer. Paste the meeting notes there. It will extract discussion points, explicit decisions, and action items, while marking missing owners or deadlines as “Not specified”.'
  }
  if (/task|plan|priority|schedule|day|week/.test(lower)) {
    return 'This request fits the Task Planner. Add your tasks, priorities, durations and working hours. The local planner will build a practical schedule and flag overload or missing details.'
  }
  if (/research|report|understand|pros|cons|compare/.test(lower)) {
    return 'This request fits the Research Assistant. For a no-API, no-fabrication workflow, paste the source material you want summarized. Without source material, the tool gives you a research framework rather than inventing facts.'
  }
  return 'I can route workplace requests to Email Generator, Meeting Summarizer, Task Planner, Research Assistant, or Smart Workspace. Tell me what you are trying to accomplish, and I will point you to the best tool. This chat runs locally and does not call an external API.'
}
