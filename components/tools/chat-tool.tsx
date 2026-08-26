'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, MessageSquare, Sparkles, Trash2, User } from 'lucide-react'
import { PageContainer, PageHeader, ResponsibleNote } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { localChatReply } from '@/lib/local-engine'

type Message = { id: string; role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Help me prioritize my day',
  'Draft a polite decline to a meeting invite',
  'Summarize my meeting notes',
  'Help me research a workplace topic',
]

export function ChatTool() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    setMessages((m) => [...m, userMessage])
    setInput('')
    setBusy(true)
    await new Promise((resolve) => setTimeout(resolve, 220))
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: 'assistant', content: localChatReply(trimmed) },
    ])
    setBusy(false)
  }

  return (
    <PageContainer>
      <PageHeader
        icon={MessageSquare}
        title="Workplace Assistant"
        description="A no-API local helper that routes workplace requests to the right specialist tool and explains what information to provide."
      />

      <div className="flex h-[calc(100vh-13rem)] min-h-[26rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">What workplace task are you trying to complete?</p>
                <p className="text-sm text-muted-foreground">Pick a prompt or type your own. No API or account is required.</p>
              </div>
              <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${m.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
                  {m.role === 'user' ? <User className="size-4" /> : <Sparkles className="size-4" />}
                </div>
                <div className="min-w-0 flex-1 space-y-1 pt-1">
                  <p className="text-xs font-medium text-muted-foreground">{m.role === 'user' ? 'You' : 'Assistant'}</p>
                  <div className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">{m.content}</div>
                </div>
              </div>
            ))
          )}
          {busy && <p className="text-sm text-muted-foreground">Organizing your request…</p>}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input) }}
          className="border-t border-border bg-background/60 p-3 md:p-4"
        >
          <div className="mb-2 flex justify-end">
            <Button type="button" size="sm" variant="ghost" onClick={() => setMessages([])} disabled={!messages.length}>
              <Trash2 className="size-3.5" /> Clear chat
            </Button>
          </div>
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault(); submit(input)
                }
              }}
              rows={1}
              placeholder="Describe a workplace task..."
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || busy} aria-label="Send message">
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-4">
        <ResponsibleNote>
          Local demo mode: this assistant does not call an external AI service, does not require an API key, and does not send your text to a third-party model.
        </ResponsibleNote>
      </div>
    </PageContainer>
  )
}
