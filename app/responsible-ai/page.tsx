import { AlertTriangle, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageHeader, ResponsibleNote } from '@/components/page-shell'

const PRINCIPLES = [
  {
    icon: CheckCircle2,
    title: 'Human review stays essential',
    text: 'AI-generated content may contain mistakes. Verify important facts, dates, decisions, and workplace communication before acting.',
  },
  {
    icon: LockKeyhole,
    title: 'Protect sensitive information',
    text: 'Do not enter passwords, confidential company information, private client data, or sensitive personal information.',
  },
  {
    icon: AlertTriangle,
    title: 'Missing details are not guessed',
    text: 'The assistant should use placeholders or “Not specified” when required information is absent rather than silently inventing it.',
  },
  {
    icon: ShieldCheck,
    title: 'Research needs verification',
    text: 'Without a verified live search source, research uses user-supplied material or general AI knowledge and must not fabricate citations or sources.',
  },
]

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        icon={ShieldCheck}
        title="Responsible AI"
        description="WorkFlow AI is designed to support human judgement, reduce hallucination, and make uncertainty visible."
      />

      <ResponsibleNote>
        AI-generated content may require human review. Verify important information before acting and
        do not enter confidential or sensitive workplace information.
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
        <CardHeader>
          <CardTitle>What the assistant does not do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>• It does not send emails on your behalf.</li>
            <li>• It does not change calendars or external systems.</li>
            <li>• It does not claim live web research when none is connected.</li>
            <li>• It does not replace professional legal, medical, financial, or safety advice.</li>
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
