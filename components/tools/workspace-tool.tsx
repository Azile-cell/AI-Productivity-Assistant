'use client'

import {
  ArrowUpRight,
  CalendarClock,
  FileText,
  HelpCircle,
  Mail,
  Search,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, priorityVariant } from '@/components/ui/badge'
import { Field, Label, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import {
  EmptyState,
  ErrorNote,
  PageContainer,
  PageHeader,
  ResponsibleNote,
  SubmitButton,
} from '@/components/page-shell'
import { runFeature } from '@/lib/ai-client'
import { setPrefill } from '@/lib/prefill'
import type {
  WorkspaceEmailItem,
  WorkspaceMeetingItem,
  WorkspaceResult,
  WorkspaceTaskItem,
} from '@/lib/types'

const EXAMPLE = `Need to reply to Sarah about the vendor contract - she asked if we can push the signing to next Friday. Also finish the Q3 budget deck before Thursday, it's high priority. Should probably look into whether async standups actually work for distributed teams. Book 30 min with Priya sometime this week to review the hiring plan.`

export function WorkspaceTool() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<WorkspaceResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) {
      setError('Paste some workplace notes to organize.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const data = await runFeature('workspace', { input })
      setResult(data)
      toast.success('Notes organized')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handoffEmail(item: WorkspaceEmailItem) {
    setPrefill('email', {
      recipientName: item.recipient === 'Not specified' ? '' : item.recipient,
      purpose: item.purpose,
      keyFacts: item.summary,
    })
    router.push('/email')
  }

  function handoffTask(item: WorkspaceTaskItem) {
    setPrefill('planner', {
      tasks: [
        {
          name: item.task,
          deadline: item.deadline === 'Not specified' ? '' : item.deadline,
          priority: item.priority,
          estimatedDuration: '',
        },
      ],
    })
    router.push('/planner')
  }

  function handoffAllTasks(items: WorkspaceTaskItem[]) {
    setPrefill('planner', {
      tasks: items.map((t) => ({
        name: t.task,
        deadline: t.deadline === 'Not specified' ? '' : t.deadline,
        priority: t.priority,
        estimatedDuration: '',
      })),
    })
    router.push('/planner')
  }

  function handoffMeeting(item: WorkspaceMeetingItem) {
    setPrefill('meeting', {
      title: item.summary,
      attendees: item.with === 'Not specified' ? '' : item.with,
      date: item.when === 'Not specified' ? '' : item.when,
      notes: item.summary,
    })
    router.push('/meetings')
  }

  function handoffResearch(question: string, context: string) {
    setPrefill('research', { topic: question, intendedUse: context })
    router.push('/research')
  }

  const isEmpty =
    result &&
    !result.emails.length &&
    !result.tasks.length &&
    !result.meetings.length &&
    !result.research.length

  return (
    <PageContainer>
      <PageHeader
        icon={Sparkles}
        title="Smart Workspace"
        description="Dump any messy stream of thoughts, and let the assistant sort it into emails to draft, tasks to plan, meetings to schedule, and things to research — then hand each item off to the right tool."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Brain dump</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field>
                <Label htmlFor="input">Your notes</Label>
                <Textarea
                  id="input"
                  placeholder="Type or paste everything on your mind — reminders, to-dos, follow-ups, half-formed ideas…"
                  className="min-h-64"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setInput(EXAMPLE)}
                  className="self-start text-xs text-primary hover:underline"
                >
                  Try an example
                </button>
              </Field>

              {error && <ErrorNote message={error} />}

              <SubmitButton loading={loading}>
                <Sparkles className="size-4" />
                {loading ? 'Organizing…' : 'Organize my notes'}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {result ? (
            isEmpty ? (
              <EmptyState icon={Sparkles}>
                No actionable items were found in those notes. Try adding more specific tasks,
                people, or follow-ups.
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-4">
                {result.emails.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Mail className="size-4 text-primary" />
                        Emails to draft
                        <span className="text-muted-foreground">({result.emails.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {result.emails.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.summary}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              To: {item.recipient} · {item.purpose}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handoffEmail(item)}
                            className="shrink-0"
                          >
                            Draft
                            <ArrowUpRight className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {result.tasks.length > 0 && (
                  <Card>
                    <CardHeader className="flex-row items-center justify-between pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <CalendarClock className="size-4 text-accent" />
                        Tasks
                        <span className="text-muted-foreground">({result.tasks.length})</span>
                      </CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => handoffAllTasks(result.tasks)}>
                        Plan all
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {result.tasks.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{item.task}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Deadline: {item.deadline}
                            </p>
                          </div>
                          <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handoffTask(item)}
                            className="shrink-0"
                          >
                            Plan
                            <ArrowUpRight className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {result.meetings.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <FileText className="size-4 text-primary" />
                        Meetings
                        <span className="text-muted-foreground">({result.meetings.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {result.meetings.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.summary}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              With: {item.with} · When: {item.when}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handoffMeeting(item)}
                            className="shrink-0"
                          >
                            Open
                            <ArrowUpRight className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {result.research.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Search className="size-4 text-accent" />
                        Research
                        <span className="text-muted-foreground">({result.research.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {result.research.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.question}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{item.context}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handoffResearch(item.question, item.context)}
                            className="shrink-0"
                          >
                            Research
                            <ArrowUpRight className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {result.missingInfo.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <HelpCircle className="size-4 text-muted-foreground" />
                        Missing information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="flex flex-col gap-1.5">
                        {result.missingInfo.map((m, i) => (
                          <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                            {m}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          ) : (
            <EmptyState icon={Sparkles}>
              Paste your notes on the left. The assistant will sort them into categorized, actionable
              items you can send straight to the right tool.
            </EmptyState>
          )}
        </div>
      </div>

      <div className="mt-6">
        <ResponsibleNote>
          The assistant only organizes what you actually wrote — it never invents tasks, people, or
          deadlines. Items marked &quot;Not specified&quot; and anything under &quot;Missing information&quot;
          need your input before acting.
        </ResponsibleNote>
      </div>
    </PageContainer>
  )
}
