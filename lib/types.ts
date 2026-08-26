// Shared request/response contracts for the WorkFlow AI application.
// These are used by both the client and the secure /api/ai route.

export type FeatureId =
  | 'email'
  | 'meeting'
  | 'planner'
  | 'research'
  | 'workspace'

export type EmailAudience =
  | 'Manager'
  | 'Client'
  | 'Colleague'
  | 'Team'
  | 'External Partner'
  | 'Other'

export type EmailTone = 'Formal' | 'Friendly' | 'Persuasive' | 'Concise'

export interface EmailRequest {
  recipientName?: string
  audience: EmailAudience
  purpose: string
  keyFacts: string
  tone: EmailTone
  senderName?: string
}

export interface EmailResult {
  subject: string
  body: string
}

export interface MeetingRequest {
  title: string
  date?: string
  attendees?: string
  notes: string
}

export interface ActionItem {
  task: string
  owner: string
  deadline: string
}

export interface MeetingResult {
  overview: string
  discussionPoints: string[]
  decisions: string[]
  actionItems: ActionItem[]
  ambiguities: string[]
}

export type TaskPriority = 'High' | 'Medium' | 'Low'

export interface PlannerTask {
  name: string
  deadline?: string
  priority: TaskPriority
  estimatedDuration?: string
}

export interface PlannerRequest {
  tasks: PlannerTask[]
  workingHours: string
  fixedCommitments?: string
}

export interface ScheduleBlock {
  timeBlock: string
  task: string
  priority: TaskPriority
}

export interface PlannerResult {
  schedule: ScheduleBlock[]
  priorityExplanation: string
  workloadRisks: string
  optimizationSuggestions: string[]
  clarifications: string[]
  overloaded: boolean
  overloadWarning: string
}

export type ResearchDepth = 'Quick Overview' | 'Standard Brief' | 'Detailed Brief'

export interface ResearchRequest {
  topic: string
  intendedUse: string
  depth: ResearchDepth
  sourceMaterial?: string
}

export interface ResearchResult {
  topic: string
  executiveSummary: string
  keyInsights: string[]
  considerations: string[]
  recommendation: string
  sourceBasis: 'User-supplied material' | 'General AI knowledge — independently verify important claims'
}

export interface WorkspaceRequest {
  input: string
}

export interface WorkspaceEmailItem {
  summary: string
  recipient: string
  purpose: string
}

export interface WorkspaceTaskItem {
  task: string
  deadline: string
  priority: TaskPriority
}

export interface WorkspaceMeetingItem {
  summary: string
  with: string
  when: string
}

export interface WorkspaceResearchItem {
  question: string
  context: string
}

export interface WorkspaceResult {
  emails: WorkspaceEmailItem[]
  tasks: WorkspaceTaskItem[]
  meetings: WorkspaceMeetingItem[]
  research: WorkspaceResearchItem[]
  missingInfo: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Discriminated map of feature -> input/output for type-safe client calls.
export interface FeatureContract {
  email: { input: EmailRequest; output: EmailResult }
  meeting: { input: MeetingRequest; output: MeetingResult }
  planner: { input: PlannerRequest; output: PlannerResult }
  research: { input: ResearchRequest; output: ResearchResult }
  workspace: { input: WorkspaceRequest; output: WorkspaceResult }
}

export interface AiApiResponse<T> {
  data?: T
  error?: string
}
