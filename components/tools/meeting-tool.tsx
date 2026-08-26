'use client'

import { AlertTriangle, CheckCircle2, FileText, ListChecks, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
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
import type { MeetingRequest, MeetingResult } from '@/lib/types'

function toPlainText(r: MeetingResult): string {
  const lines: string[] = []
  lines.push('OVERVIEW', r.overview, '')
  lines.push('DISCUSSION POINTS', ...r.discussionPoints.map((d) => `- ${d}`), '')
  lines.push('DECISIONS', ...r.decisions.map((d) => `- ${d}`), '')
  lines.push(
    'ACTION ITEMS',
    ...r.actionItems.map((a) => `- ${a.task} (Owner: ${a.owner}, Deadline: ${a.deadline})`),
    '',
  )
  if (r.ambiguities.length) {
    lines.push('NEEDS CONFIRMATION', ...r.ambiguities.map((a) => `- ${a}`))
  }
  return lines.join('\n')
}

export function MeetingTool() {
  const [form, setForm] = useState<MeetingRequest>({
    title: '',
    date: '',
    attendees: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<MeetingResult | null>(null)

  useEffect(() => {
    const pre = consumePrefill<Partial<MeetingRequest>>('meeting')
    if (pre) setForm((f) => ({ ...f, ...pre }))
  }, [])

  function update<K extends keyof MeetingRequest>(key: K, value: MeetingRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.notes.trim()) {
      setError('Please provide a meeting title and the notes or transcript.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const data = await runFeature('meeting', form)
      setResult(data)
      recordActivity({
        type: 'meeting',
        title: form.title,
        preview: data.overview.slice(0, 120),
        content: toPlainText(data),
      })
      toast.success('Meeting summarized')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        icon={FileText}
        title="Meeting Summarizer"
        description="Paste raw notes or a transcript to extract a clean summary, confirmed decisions, and owner-assigned action items. Ambiguous or contradictory points are flagged, never guessed."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meeting notes</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field>
                <Label htmlFor="title">Meeting title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Q3 Product Roadmap Review"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="date">Date (optional)</Label>
                  <Input
                    id="date"
                    placeholder="e.g. 12 Aug 2026"
                    value={form.date}
                    onChange={(e) => update('date', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="attendees">Attendees (optional)</Label>
                  <Input
                    id="attendees"
                    placeholder="e.g. Sarah, Alex, Priya"
                    value={form.attendees}
                    onChange={(e) => update('attendees', e.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <Label htmlFor="notes">Notes / transcript</Label>
                <Textarea
                  id="notes"
                  placeholder="Paste the raw meeting notes or transcript here…"
                  className="min-h-56"
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                />
              </Field>

              {error && <ErrorNote message={error} />}

              <SubmitButton loading={loading}>
                <Sparkles className="size-4" />
                {loading ? 'Summarizing…' : 'Summarize meeting'}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Summary</CardTitle>
              {result && <CopyButton text={toPlainText(result)} label="Copy all" />}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="flex flex-col gap-5">
                  <section>
                    <p className="text-sm leading-relaxed">{result.overview}</p>
                  </section>

                  {result.discussionPoints.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Discussion points
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {result.discussionPoints.map((d, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-primary" />
                      Decisions
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {result.decisions.map((d, i) => (
                        <li key={i} className="text-sm leading-relaxed">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <ListChecks className="size-3.5 text-accent" />
                      Action items
                    </h3>
                    {result.actionItems.length ? (
                      <div className="flex flex-col gap-2">
                        {result.actionItems.map((a, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-border bg-background/40 px-3.5 py-2.5"
                          >
                            <p className="text-sm font-medium">{a.task}</p>
                            <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <Badge variant="muted">Owner: {a.owner}</Badge>
                              <Badge variant="muted">Deadline: {a.deadline}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No action items identified.</p>
                    )}
                  </section>

                  {result.ambiguities.length > 0 && (
                    <section className="rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-3">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                        <AlertTriangle className="size-3.5" />
                        Needs confirmation
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {result.ambiguities.map((a, i) => (
                          <li key={i} className="text-sm leading-relaxed text-foreground/90">
                            {a}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              ) : (
                <EmptyState icon={FileText}>
                  Paste your meeting notes and the structured summary — decisions, action items, and
                  open questions — will appear here.
                </EmptyState>
              )}
            </CardContent>
          </Card>

          <ResponsibleNote>
            Owners and deadlines are only extracted when clearly stated. Anything marked
            &quot;Not specified&quot; or listed under &quot;Needs confirmation&quot; should be verified with
            attendees.
          </ResponsibleNote>
        </div>
      </div>
    </PageContainer>
  )
}
