'use client'

import { AlertTriangle, Lightbulb, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Label, Select, Textarea } from '@/components/ui/field'
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
import type { ResearchDepth, ResearchRequest, ResearchResult } from '@/lib/types'

const DEPTHS: ResearchDepth[] = ['Quick Overview', 'Standard Brief', 'Detailed Brief']

function toPlainText(r: ResearchResult): string {
  const lines = [
    `TOPIC: ${r.topic}`,
    '',
    'EXECUTIVE SUMMARY',
    r.executiveSummary,
    '',
    'KEY INSIGHTS',
    ...r.keyInsights.map((k) => `- ${k}`),
    '',
    'CONSIDERATIONS',
    ...r.considerations.map((c) => `- ${c}`),
    '',
    'RECOMMENDATION',
    r.recommendation,
    '',
    `SOURCE BASIS: ${r.sourceBasis}`,
  ]
  return lines.join('\n')
}

export function ResearchTool() {
  const [form, setForm] = useState<ResearchRequest>({
    topic: '',
    intendedUse: '',
    depth: 'Standard Brief',
    sourceMaterial: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResearchResult | null>(null)

  useEffect(() => {
    const pre = consumePrefill<Partial<ResearchRequest>>('research')
    if (pre) setForm((f) => ({ ...f, ...pre }))
  }, [])

  function update<K extends keyof ResearchRequest>(key: K, value: ResearchRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.topic.trim() || !form.intendedUse.trim()) {
      setError('Please provide the topic and how you intend to use the research.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const data = await runFeature('research', form)
      setResult(data)
      recordActivity({
        type: 'research',
        title: data.topic,
        preview: data.executiveSummary.slice(0, 120),
        content: toPlainText(data),
      })
      toast.success('Research brief ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const usingSource = Boolean(form.sourceMaterial && form.sourceMaterial.trim())

  return (
    <PageContainer>
      <PageHeader
        icon={Search}
        title="Research Assistant"
        description="Get a concise workplace brief on any topic. Facts are separated from interpretation, uncertainty is flagged, and the source of the information is always made explicit."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Research request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field>
                <Label htmlFor="topic">Topic or question</Label>
                <Input
                  id="topic"
                  placeholder="e.g. Pros and cons of async standups for remote teams"
                  value={form.topic}
                  onChange={(e) => update('topic', e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="intendedUse">How will you use this?</Label>
                <Input
                  id="intendedUse"
                  placeholder="e.g. Recommendation for my manager"
                  value={form.intendedUse}
                  onChange={(e) => update('intendedUse', e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="depth">Depth</Label>
                <Select
                  id="depth"
                  value={form.depth}
                  onChange={(e) => update('depth', e.target.value as ResearchDepth)}
                >
                  {DEPTHS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label htmlFor="source">Source material (optional)</Label>
                <Textarea
                  id="source"
                  placeholder="Paste any document, article, or notes to base the brief on. If provided, the assistant prioritizes this over general knowledge."
                  className="min-h-32"
                  value={form.sourceMaterial}
                  onChange={(e) => update('sourceMaterial', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {usingSource
                    ? 'Brief will be grounded in your supplied material.'
                    : 'No source supplied — the brief will use general AI knowledge and flag what to verify.'}
                </p>
              </Field>

              {error && <ErrorNote message={error} />}

              <SubmitButton loading={loading}>
                <Sparkles className="size-4" />
                {loading ? 'Researching…' : 'Generate brief'}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Brief</CardTitle>
              {result && <CopyButton text={toPlainText(result)} label="Copy all" />}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="flex flex-col gap-5">
                  <Badge variant={result.sourceBasis === 'User-supplied material' ? 'primary' : 'accent'}>
                    <ShieldCheck className="size-3" />
                    {result.sourceBasis}
                  </Badge>

                  <section>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Executive summary
                    </h3>
                    <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
                  </section>

                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Key insights
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {result.keyInsights.map((k, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                          {k}
                        </li>
                      ))}
                    </ul>
                  </section>

                  {result.considerations.length > 0 && (
                    <section className="rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-3">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                        <AlertTriangle className="size-3.5" />
                        Considerations &amp; caveats
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {result.considerations.map((c, i) => (
                          <li key={i} className="text-sm leading-relaxed text-foreground/90">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section>
                    <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Lightbulb className="size-3.5 text-primary" />
                      Recommendation
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {result.recommendation}
                    </p>
                  </section>
                </div>
              ) : (
                <EmptyState icon={Search}>
                  Your research brief will appear here — a summary, key insights, considerations, and a
                  clearly-labeled recommendation.
                </EmptyState>
              )}
            </CardContent>
          </Card>

          <ResponsibleNote>
            This assistant has no live web access. Without supplied source material, briefs rely on
            general AI knowledge that may be outdated or incomplete — independently verify important
            claims, especially for financial, legal, medical, or safety topics.
          </ResponsibleNote>
        </div>
      </div>
    </PageContainer>
  )
}
