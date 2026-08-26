'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, MessageSquare, Sparkles, Square, User } from 'lucide-react'
import { PageContainer, PageHeader, ResponsibleNote } from '@/components/page-shell'
import { Button } from '@/components/ui/button'

const SUGGESTIONS = [
  'Help me prioritize my day',
  'Draft a polite decline to a meeting invite',
  'Summarize the pros and cons of async standups',
  'Give me a 3-step framework for deep work',
]

function messageText(parts: { type: string; text?: string }[]) {
  return parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')
}

export function ChatTool() {
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    sendMessage({ text: trimmed })
    setInput('')
  }

  return (
    <PageContainer>
      <PageHeader
        icon={MessageSquare}
        title="Workplace AI Chatbot"
        description="Ask for practical workplace help, drafts, planning support, or guidance on which specialist tool to use."
      />

      <div className="flex h-[calc(100vh-13rem)] min-h-[26rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">How can I help you work smarter today?</p>
                <p className="text-sm text-muted-foreground">Pick a prompt or type your own.</p>
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
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    m.role === 'user'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {m.role === 'user' ? <User className="size-4" /> : <Sparkles className="size-4" />}
                </div>
                <div className="min-w-0 flex-1 space-y-1 pt-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {m.role === 'user' ? 'You' : 'Assistant'}
                  </p>
                  <div className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">
                    {messageText(m.parts)}
                  </div>
                </div>
              </div>
            ))
          )}

          {status === 'submitted' && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div className="flex items-center gap-1 pt-2.5">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Something went wrong. Please try sending your message again.
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
          className="border-t border-border bg-background/60 p-3 md:p-4"
        >
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  submit(input)
                }
              }}
              rows={1}
              placeholder="Ask a workplace productivity question..."
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {busy ? (
              <Button type="button" size="icon" variant="secondary" onClick={() => stop()} aria-label="Stop">
                <Square className="size-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-4">
        <ResponsibleNote>
          AI-generated content may require human review. Do not enter passwords, confidential company
          information, private client data, or other sensitive information.
        </ResponsibleNote>
      </div>
    </PageContainer>
  )
}
