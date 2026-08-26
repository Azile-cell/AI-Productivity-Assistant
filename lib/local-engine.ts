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
  const factsText = facts.length ? facts.join(' ') : '[SPECIFIC DETAIL]'

  const greeting = r.tone === 'Friendly' ? `Hi ${recipient},` : `Dear ${recipient},`
  const purposeLower = purpose ? purpose.charAt(0).toLowerCase() + purpose.slice(1) : 'share this workplace update'
  const actionPurpose = /^(request|ask|inform|confirm|follow up|share|decline|invite|thank|apologi[sz]e|submit|provide|arrange)\b/i.test(purpose)

  const opener =
    r.tone === 'Persuasive'
      ? actionPurpose
        ? `I’m writing to ${purposeLower}. I’d like to explain the context clearly so we can agree on the next step.`
        : `I’m writing regarding ${purpose}. I’d like to explain the context clearly so we can agree on the next step.`
      : r.tone === 'Concise'
        ? actionPurpose
          ? `I’m writing to ${purposeLower}.`
          : `I’m writing regarding ${purpose}.`
        : r.tone === 'Friendly'
          ? actionPurpose
            ? `I hope you’re well. I’m reaching out to ${purposeLower}.`
            : `I hope you’re well. I’m reaching out regarding ${purpose}.`
          : actionPurpose
            ? `I am writing to ${purposeLower}.`
            : `I am writing regarding ${purpose}.`

  const closing =
    r.tone === 'Persuasive'
      ? 'Please let me know whether this works for you, or if you would prefer an alternative.'
      : 'Please let me know if you need any further information.'

  return {
    subject: titleFromPurpose(purpose),
    body: `${greeting}\n\n${opener}\n\n${factsText}\n\n${closing}\n\nKind regards,\n${sender}`,
  }
}

function deadlineFrom(text: string): string {
  const patterns = [
    /\b((?:by|for|on)\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
    /\b((?:today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)))\b/i,
    /\b((?:by|for|on)\s+\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i,
    /\b(\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?)\b/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  return 'Not specified'
}

function meetingWhenFrom(text: string): string {
  const patterns = [
    /\b(today|tomorrow|tonight|this\s+(?:morning|afternoon|evening)|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
    /\b((?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
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

  const negatedDecision = /\b(?:not|never|no)\b.{0,28}\b(?:agreed|decided|approved|confirmed|resolved|postponed|selected|chose)\b/i
  const decisions = parts.filter((s) => decisionWords.test(s) && !negatedDecision.test(s))
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
      ? `${r.title || 'Meeting'} covered ${Math.min(parts.length, 8)} main point${parts.length === 1 ? '' : 's'}. This summary only reflects the notes entered by the user.`
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

type FixedBlock = { start: number; end: number; label: string }

function parseFixedCommitments(text?: string): FixedBlock[] {
  if (!text?.trim()) return []
  const blocks: FixedBlock[] = []
  const normalized = text.replace(/[—–]/g, '-')
  const pieces = normalized.split(/[;,\n]+/).map((x) => clean(x)).filter(Boolean)

  const toMin = (hourRaw: string, minuteRaw?: string, apRaw?: string) => {
    let hour = Number(hourRaw)
    const minute = Number(minuteRaw || 0)
    const ap = apRaw?.toLowerCase()
    if (ap === 'pm' && hour < 12) hour += 12
    if (ap === 'am' && hour === 12) hour = 0
    return hour * 60 + minute
  }

  for (const piece of pieces) {
    const m = piece.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (!m) continue
    const startAp = m[3] || m[6]
    const endAp = m[6] || m[3]
    const start = toMin(m[1], m[2], startAp)
    let end = toMin(m[4], m[5], endAp)
    if (!m[3] && !m[6] && end <= start && start < 12 * 60) end += 12 * 60
    if (end <= start) continue
    const label = clean(piece.replace(m[0], '').replace(/^[-:]+|[-:]+$/g, '')) || 'Fixed commitment'
    blocks.push({ start, end, label })
  }

  return blocks.sort((a, b) => a.start - b.start)
}

const priorityScore: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 }

export function planTasks(r: PlannerRequest): PlannerResult {
  const window = parseWorkingWindow(r.workingHours)
  const fixedBlocks = parseFixedCommitments(r.fixedCommitments).filter(
    (b) => b.end > window.start && b.start < window.end,
  )
  const fixedMinutes = fixedBlocks.reduce(
    (sum, b) => sum + Math.max(0, Math.min(b.end, window.end) - Math.max(b.start, window.start)),
    0,
  )
  const available = Math.max(0, window.end - window.start - fixedMinutes)

  const ranked = r.tasks
    .map((task) => ({ task, duration: minutesFromDuration(task.estimatedDuration) ?? 60 }))
    .sort((a, b) => {
      const dp = priorityScore[b.task.priority] - priorityScore[a.task.priority]
      if (dp) return dp
      return Number(Boolean(b.task.deadline)) - Number(Boolean(a.task.deadline))
    })

  const total = ranked.reduce((sum, x) => sum + x.duration, 0) + Math.max(0, ranked.length - 1) * 10
  const schedule = [] as PlannerResult['schedule']
  const remaining = [...ranked]
  let cursor = window.start

  const activeBlock = (time: number) => fixedBlocks.find((b) => time >= b.start && time < b.end)
  const nextBlock = (time: number) => fixedBlocks.find((b) => b.start >= time)

  while (remaining.length && cursor < window.end) {
    const blocked = activeBlock(cursor)
    if (blocked) {
      cursor = Math.min(window.end, blocked.end + 10)
      continue
    }

    const upcoming = nextBlock(cursor)
    const gapEnd = upcoming ? Math.min(upcoming.start, window.end) : window.end
    const gap = gapEnd - cursor

    let choiceIndex = remaining.findIndex((x) => x.duration <= gap)
    if (choiceIndex === -1) {
      if (upcoming) {
        cursor = Math.min(window.end, upcoming.end + 10)
        continue
      }
      break
    }

    const [choice] = remaining.splice(choiceIndex, 1)
    const end = cursor + choice.duration
    schedule.push({
      timeBlock: `${fmt(cursor)}–${fmt(end)}`,
      task: `${choice.task.name}${choice.task.estimatedDuration ? '' : ' (60 min planning estimate)'}`,
      priority: choice.task.priority,
    })
    cursor = Math.min(window.end, end + 10)
  }

  const overloaded = total > available || remaining.length > 0
  const clarifications = ranked
    .map((x) => x.task)
    .filter((t) => !t.deadline || !t.estimatedDuration)
    .map((t) => `${t.name}: ${!t.deadline ? 'deadline' : ''}${!t.deadline && !t.estimatedDuration ? ' and ' : ''}${!t.estimatedDuration ? 'duration' : ''} not specified.`)

  const commitmentSummary = fixedBlocks.length
    ? `Fixed commitments were blocked out: ${fixedBlocks.map((b) => `${b.label} ${fmt(b.start)}–${fmt(b.end)}`).join('; ')}.`
    : ''

  const workloadRisks = overloaded
    ? `${remaining.length ? `${remaining.length} task${remaining.length === 1 ? '' : 's'} could not be fitted into the available working window. ` : ''}${commitmentSummary}`.trim()
    : fixedBlocks.length
      ? `${commitmentSummary} The remaining tasks fit around those commitments using the entered durations.`
      : 'No obvious overload was detected from the entered task durations and working window.'

  return {
    schedule,
    priorityExplanation: 'Tasks are ranked by the priorities you entered. When a high-priority task is too long for a gap before a fixed commitment, the planner may place a shorter lower-priority task in that gap rather than waste usable time. No priority or deadline is invented.',
    workloadRisks,
    optimizationSuggestions: [
      'Confirm missing deadlines before committing to the plan.',
      'Adjust any labelled planning estimates to match your real pace.',
      'Keep a short buffer between high-focus tasks and fixed commitments.',
    ],
    clarifications,
    overloaded,
    overloadWarning: overloaded
      ? `The entered workload does not fully fit. Task work plus buffers needs about ${Math.round((total / 60) * 10) / 10} hours, while about ${Math.round((available / 60) * 10) / 10} working hours remain after fixed commitments.`
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
  const role = text.match(/\b(?:my\s+)?(manager|supervisor|client|colleague|team|customer|partner)\b/i)
  if (role) return role[1].charAt(0).toUpperCase() + role[1].slice(1).toLowerCase()

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

  const taskWords = /\b(need to|needs to|have to|has to|must|finish|complete|prepare|review|update|submit|create|draft|fix|do|finalize)\b/i
  const meetingWords = /\b(meeting|meet|call|catch up|discussed|discussion|agreed|decided)\b/i
  const researchWords = /\b(research|look into|find out|compare|investigate|learn about|understand|risks?|benefits?|pros|cons|evidence|information about|whether)\b/i

  const addTask = (taskText: string) => {
    const text = clean(taskText.replace(/^I\s+(?:also\s+)?(?:need to|have to)\s+/i, ''))
    if (!text) return
    const deadline = deadlineFrom(text)
    result.tasks.push({ task: text, deadline, priority: priorityFrom(text) })
    if (deadline === 'Not specified') result.missingInfo.push(`Task deadline not specified: ${text}`)
  }

  for (const raw of items) {
    const s = clean(raw)
    const lower = s.toLowerCase()

    if (/\b(reply|email|send|write|follow up)\b/.test(lower) && !meetingWords.test(s)) {
      const recipient = recipientFrom(s)
      result.emails.push({ summary: s, recipient, purpose: s })
      if (recipient === 'Not specified') result.missingInfo.push(`Email recipient not specified: ${s}`)
      continue
    }

    if (researchWords.test(s)) {
      result.research.push({ question: s, context: 'Workplace note requiring evidence or further research.' })
      continue
    }

    if (meetingWords.test(s)) {
      const withPerson = meetingWith(s)
      const when = meetingWhenFrom(s)
      result.meetings.push({ summary: s, with: withPerson, when })
      if (withPerson === 'Not specified') result.missingInfo.push(`Meeting participant not specified: ${s}`)
      if (when === 'Not specified') result.missingInfo.push(`Meeting time/date not specified: ${s}`)

      const clauses = s.split(/\band\b/i).map(clean).filter(Boolean)
      for (const clause of clauses) {
        if (taskWords.test(clause) && !meetingWords.test(clause)) addTask(clause)
      }
      continue
    }

    if (taskWords.test(s)) {
      const clauses = s.split(/\band\b/i).map(clean).filter(Boolean)
      const actionable = clauses.filter((clause) => taskWords.test(clause))
      if (actionable.length > 1) actionable.forEach(addTask)
      else addTask(s)
      continue
    }

    result.missingInfo.push(`Could not confidently classify: ${s}`)
  }

  return result
}

export function localChatReply(input: string): string {
  const q = clean(input)
  const lower = q.toLowerCase()

  if (/prioriti[sz]e|what should i do first|where should i start/.test(lower)) {
    return 'Start with work that is both urgent and important: anything due today first, then the nearest high-priority deadline, then lower-priority work. Add the tasks to Task Planner with their real deadlines, durations and fixed commitments so it can build a time-blocked schedule without guessing.'
  }
  if (/email|message|write|draft/.test(lower)) {
    return 'Use the Email Generator for this. Choose the audience and tone, then enter the purpose and only the facts you want included. It will create a structured draft with placeholders for anything missing, so you can review it before sending.'
  }
  if (/meeting|minutes|notes|summary|summar/.test(lower)) {
    return 'Use the Meeting Summarizer. Paste the original notes there; it separates discussion from confirmed decisions and action items, and marks missing owners or deadlines as “Not specified”.'
  }
  if (/task|plan|priority|schedule|day|week/.test(lower)) {
    return 'Use the Task Planner. Add your tasks, priorities, durations, working hours and fixed commitments. The local planner will block out commitments, schedule the remaining work and warn you if everything does not fit.'
  }
  if (/research|report|understand|risk|benefit|pros|cons|compare/.test(lower)) {
    return 'Use the Research Assistant. Paste the source material you want summarized so the brief stays evidence-based. Without source material, it gives you a research framework instead of inventing facts or citations.'
  }
  return 'I can guide you to Email Generator, Meeting Summarizer, Task Planner, Research Assistant, or Smart Workspace. Tell me the workplace outcome you need, and I will point you to the safest, most useful workflow. This helper runs locally and does not call an external API.'
}

