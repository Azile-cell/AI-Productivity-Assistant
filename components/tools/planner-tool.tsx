'use client'

import {
  AlertTriangle,
  CalendarClock,
  Lightbulb,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, priorityVariant } from '@/components/ui/badge'
import { Field, Input, Label, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import {
  CopyButton,
  EmptyState,
  ErrorNote,
  PageContainer,
  PageHeader,
  ResponsibleNote,
  SubmitButton,
} from '@/components/page-shell'
import { runFeature } from '@/lib/ai-client'
import { recordActivity } from '@/lib/activity'
import { consumePrefill } from '@/lib/prefill'
import type { PlannerRequest, PlannerResult, PlannerTask, TaskPriority } from '@/lib/types'

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low']

function emptyTask(): PlannerTask {
  return { name: '', deadline: '', priority: 'Medium', estimatedDuration: '' }
}

function toPlainText(r: PlannerResult): string {
  const lines: string[] = ['SCHEDULE']
  r.schedule.forEach((s) => lines.push(`- ${s.timeBlock}: ${s.task} [${s.priority}]`))
  lines.push('', 'WHY THIS ORDER', r.priorityExplanation, '', 'WORKLOAD RISKS', r.workloadRisks)
  if (r.optimizationSuggestions.length)
    lines.push('', 'SUGGESTIONS', ...r.optimizationSuggestions.map((s) => `- ${s}`))
  return lines.join('\n')
}

export function PlannerTool() {
  const [tasks, setTasks] = useState<PlannerTask[]>([emptyTask()])
  const [workingHours, setWorkingHours] = useState('9:00 AM – 5:00 PM')
  const [fixedCommitments, setFixedCommitments] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PlannerResult | null>(null)

  useEffect(() => {
    const pre = consumePrefill<{ tasks?: PlannerTask[] }>('planner')
    if (pre?.tasks?.length) setTasks(pre.tasks.map((t) => ({ ...emptyTask(), ...t })))
  }, [])

  function updateTask(index: number, patch: Partial<PlannerTask>) {
    setTasks((ts) => ts.map((t, i) => (i === index ? { ...t, ...patch } : t)))
  }

  function addTask() {
    setTasks((ts) => [...ts, emptyTask()])
  }

  function removeTask(index: number) {
    setTasks((ts) => (ts.length === 1 ? ts : ts.filter((_, i) => i !== index)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validTasks = tasks.filter((t) => t.name.trim())
    if (!validTasks.length) {
      setError('Add at least one task with a name.')
      return
    }
    if (!workingHours.trim()) {
      setError('Please specify your available working hours.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    const payload: PlannerRequest = { tasks: validTasks, workingHours, fixedCommitments }
    try {
      const data = await runFeature('planner', payload)
      setResult(data)
      recordActivity({
        type: 'planner',
        title: `Plan for ${validTasks.length} task${validTasks.length > 1 ? 's' : ''}`,
        preview: data.priorityExplanation.slice(0, 120),
        content: toPlainText(data),
      })
      toast.success('Schedule created')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        icon={CalendarClock}
        title="Task Planner"
        description="Enter your tasks and constraints to get a realistic, prioritized schedule. The planner respects your working hours and fixed commitments, and warns you when the workload does not fit."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your tasks &amp; constraints</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                {tasks.map((task, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-background/40 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Task {i + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeTask(i)}
                        disabled={tasks.length === 1}
                        aria-label={`Remove task ${i + 1}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="Task name (e.g. Finish Q3 report draft)"
                        value={task.name}
                        onChange={(e) => updateTask(i, { name: e.target.value })}
                      />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Input
                          placeholder="Deadline"
                          value={task.deadline}
                          onChange={(e) => updateTask(i, { deadline: e.target.value })}
                        />
                        <Input
                          placeholder="Est. duration"
                          value={task.estimatedDuration}
                          onChange={(e) => updateTask(i, { estimatedDuration: e.target.value })}
                        />
                        <Select
                          value={task.priority}
                          onChange={(e) =>
                            updateTask(i, { priority: e.target.value as TaskPriority })
                          }
                          aria-label={`Priority for task ${i + 1}`}
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addTask} className="self-start">
                  <Plus className="size-3.5" />
                  Add task
                </Button>
              </div>

              <Field>
                <Label htmlFor="workingHours">Available working hours</Label>
                <Input
                  id="workingHours"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="fixed">Fixed commitments (optional)</Label>
                <Input
                  id="fixed"
                  placeholder="e.g. Standup 9:30–9:45, Lunch 12:30–1:30"
                  value={fixedCommitments}
                  onChange={(e) => setFixedCommitments(e.target.value)}
                />
              </Field>

              {error && <ErrorNote message={error} />}

              <SubmitButton loading={loading}>
                <Sparkles className="size-4" />
                {loading ? 'Planning…' : 'Build my schedule'}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Your plan</CardTitle>
              {result && <CopyButton text={toPlainText(result)} label="Copy all" />}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="flex flex-col gap-5">
                  {result.overloaded && result.overloadWarning && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <p className="text-sm leading-relaxed text-destructive">
                        {result.overloadWarning}
                      </p>
                    </div>
                  )}

                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Schedule
                    </h3>
                    <div className="flex flex-col gap-2">
                      {result.schedule.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-2.5"
                        >
                          <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">
                            {s.timeBlock}
                          </span>
                          <span className="min-w-0 flex-1 text-sm">{s.task}</span>
                          <Badge variant={priorityVariant(s.priority)}>{s.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Why this order
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {result.priorityExplanation}
                    </p>
                  </section>

                  <section>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Workload risks
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {result.workloadRisks}
                    </p>
                  </section>

                  {result.optimizationSuggestions.length > 0 && (
                    <section>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Lightbulb className="size-3.5 text-accent" />
                        Suggestions
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {result.optimizationSuggestions.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent/60" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              ) : (
                <EmptyState icon={CalendarClock}>
                  Add your tasks and constraints, and a realistic prioritized schedule will appear
                  here with clear reasoning.
                </EmptyState>
              )}
            </CardContent>
          </Card>

          <ResponsibleNote>
            The schedule is a suggestion based on the details you entered. Estimated durations are
            marked and may not reflect reality — adjust the plan to fit your actual pace and
            priorities.
          </ResponsibleNote>
        </div>
      </div>
    </PageContainer>
  )
}
