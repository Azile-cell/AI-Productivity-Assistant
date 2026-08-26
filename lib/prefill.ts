'use client'

// Smart Workspace hands off extracted data to individual tools via
// sessionStorage. Tools read and clear it on mount to pre-fill their forms.

const PREFIX = 'workflow-ai:prefill:'

export function setPrefill(tool: string, data: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(PREFIX + tool, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function consumePrefill<T>(tool: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(PREFIX + tool)
    if (!raw) return null
    window.sessionStorage.removeItem(PREFIX + tool)
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
