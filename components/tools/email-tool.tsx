'use client'

import { Mail, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { EmailAudience, EmailRequest, EmailResult, EmailTone } from '@/lib/types'

const AUDIENCES: EmailAudience[] = [
  'Manager',
  'Client',
  'Colleague',
  'Team',
  'External Partner',
  'Other',
]
const TONES: EmailTone[] = ['Formal', 'Friendly', 'Persuasive', 'Concise']

export function EmailTool() {
  const [form, setForm] = useState<EmailRequest>({
    recipientName: '',
    audience: 'Manager',
    purpose: '',
    keyFacts: '',
    tone: 'Formal',
    senderName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<EmailResult | null>(null)

  // Pre-fill from Smart Workspace handoff.
  useEffect(() => {
    const pre = consumePrefill<Partial<EmailRequest>>('email')
    if (pre) setForm((f) => ({ ...f, ...pre }))
  }, [])

  function update<K extends keyof EmailRequest>(key: K, value: EmailRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.purpose.trim() || !form.keyFacts.trim()) {
      setError('Please provide both the purpose and the key facts for the email.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const data = await runFeature('email', form)
      setResult(data)
      recordActivity({
        type: 'email',
        title: data.subject,
        preview: data.body.slice(0, 120),
        content: `Subject: ${data.subject}\n\n${data.body}`,
      })
      toast.success('Email drafted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        icon={Mail}
        title="Email Generator"
        description="Describe the purpose and key facts, and get a professional email matched to your audience and tone. Missing details are marked with placeholders rather than invented."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="audience">Audience</Label>
                  <Select
                    id="audience"
                    value={form.audience}
                    onChange={(e) => update('audience', e.target.value as EmailAudience)}
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    id="tone"
                    value={form.tone}
                    onChange={(e) => update('tone', e.target.value as EmailTone)}
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="recipientName">Recipient name (optional)</Label>
                  <Input
                    id="recipientName"
                    placeholder="e.g. Sarah Chen"
                    value={form.recipientName}
                    onChange={(e) => update('recipientName', e.target.value)}
                  />
                </Field>
                <Field>
                  <Label htmlFor="senderName">Your name (optional)</Label>
                  <Input
                    id="senderName"
                    placeholder="e.g. Alex Rivera"
                    value={form.senderName}
                    onChange={(e) => update('senderName', e.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <Label htmlFor="purpose">Purpose of the email</Label>
                <Input
                  id="purpose"
                  placeholder="e.g. Request a deadline extension for the Q3 report"
                  value={form.purpose}
                  onChange={(e) => update('purpose', e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="keyFacts">Key facts / details to include</Label>
                <Textarea
                  id="keyFacts"
                  placeholder="List the concrete details: dates, numbers, context, what you need. Only what you enter here will be used."
                  className="min-h-32"
                  value={form.keyFacts}
                  onChange={(e) => update('keyFacts', e.target.value)}
                />
              </Field>

              {error && <ErrorNote message={error} />}

              <SubmitButton loading={loading}>
                <Send className="size-4" />
                {loading ? 'Drafting…' : 'Generate email'}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Draft</CardTitle>
              {result && (
                <div className="flex gap-2">
                  <CopyButton text={result.subject} label="Subject" />
                  <CopyButton text={result.body} label="Body" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg border border-border bg-background/40 px-3.5 py-2.5">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Subject
                    </p>
                    <p className="mt-1 text-sm font-medium">{result.subject}</p>
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg border border-border bg-background/40 px-3.5 py-3 text-sm leading-relaxed">
                    {result.body}
                  </div>
                </div>
              ) : (
                <EmptyState icon={Mail}>
                  Your generated email will appear here. Fill in the details and select a tone to get
                  started.
                </EmptyState>
              )}
            </CardContent>
          </Card>

          <ResponsibleNote>
            Placeholders like [RECIPIENT NAME] mean that detail was not provided — replace them before
            sending. Always review the draft for accuracy and tone.
          </ResponsibleNote>
        </div>
      </div>
    </PageContainer>
  )
}
