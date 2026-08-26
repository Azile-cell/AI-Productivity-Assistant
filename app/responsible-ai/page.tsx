'use client'

import { AlertTriangle, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageHeader, ResponsibleNote } from '@/components/page-shell'

const PRINCIPLES = [
  {
    icon: CheckCircle2,
    title: 'Human review stays essential',
    text: 'Templates, summaries and schedules can still miss context. Verify important facts, dates, decisions and workplace communication before acting.',
  },
  {
    icon: LockKeyhole,
    title: 'No external API dependency',
    text: 'This deployed prototype runs locally in the browser and does not require an API key, paid model account or external AI service.',
  },
  {
    icon: AlertTriangle,
    title: 'Missing details are not guessed',
    text: 'The assistant uses placeholders or “Not specified” when required information is absent rather than silently inventing it.',
  },
  {
    icon: ShieldCheck,
    title: 'Research stays evidence-based',
    text: 'The Research Assistant summarizes text supplied by the user. Without source material it returns a research framework instead of fabricating claims or citations.',
  },
]

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        icon={ShieldCheck}
        title="Responsible AI &amp; Prototype Safety"
        description="WorkFlow AI demonstrates responsible workplace automation without paid APIs or hidden external model calls."
      />

      <ResponsibleNote>
        No API key is required. This prototype uses local rules and structured templates. Review important outputs before using them in real workplace decisions.
      </ResponsibleNote>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>What the assistant does not do</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>• It does not send emails on your behalf.</li>
            <li>• It does not change calendars or external systems.</li>
            <li>• It does not call Claude, Gemini, OpenAI or another model API.</li>
            <li>• It does not fabricate live research or pretend it browsed the web.</li>
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
