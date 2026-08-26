'use client'

// Lightweight local activity + history store backed by localStorage.
// No API keys or sensitive authentication data are ever stored here.

export type HistoryType = 'email' | 'meeting' | 'planner' | 'research'

export interface HistoryItem {
  id: string
  type: HistoryType
  title: string
  preview: string
  content: string // serialized full result for viewing
  createdAt: number
}

const HISTORY_KEY = 'workflow-ai:history'

const COUNT_KEYS: Record<HistoryType, string> = {
  email: 'workflow-ai:count:email',
  meeting: 'workflow-ai:count:meeting',
  planner: 'workflow-ai:count:planner',
  research: 'workflow-ai:count:research',
}

export interface ActivityCounts {
  email: number
  meeting: number
  planner: number
  research: number
}

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore storage errors (private mode / quota).
  }
}

export function getCounts(): ActivityCounts {
  return {
    email: Number(safeGet(COUNT_KEYS.email) || 0),
    meeting: Number(safeGet(COUNT_KEYS.meeting) || 0),
    planner: Number(safeGet(COUNT_KEYS.planner) || 0),
    research: Number(safeGet(COUNT_KEYS.research) || 0),
  }
}

export function getHistory(): HistoryItem[] {
  const raw = safeGet(HISTORY_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as HistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('workflow-ai:activity'))
  }
}

// Record a completed action: increments the counter and stores a history entry.
export function recordActivity(item: Omit<HistoryItem, 'id' | 'createdAt'>): void {
  const countKey = COUNT_KEYS[item.type]
  safeSet(countKey, String(Number(safeGet(countKey) || 0) + 1))

  const history = getHistory()
  const entry: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  }
  history.unshift(entry)
  safeSet(HISTORY_KEY, JSON.stringify(history.slice(0, 100)))
  notify()
}

export function deleteHistoryItem(id: string): void {
  const history = getHistory().filter((h) => h.id !== id)
  safeSet(HISTORY_KEY, JSON.stringify(history))
  notify()
}

export function clearHistory(): void {
  safeSet(HISTORY_KEY, JSON.stringify([]))
  notify()
}
