'use client'

import {
  ArrowRight,
  CalendarClock,
  FileText,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsibleNote } from '@/components/page-shell'
import { getCounts, type ActivityCounts } from '@/lib/activity'

const TOOLS = [
  {
    href: '/email',
    icon: Mail,
    title: 'Email Generator',
    description: 'Draft professional emails matched to audience and tone.',
    key: 'email' as const,
  },
  {
    href: '/meetings',
    icon: FileText,
    title: 'Meeting Summarizer',
    description: 'Turn raw notes into decisions and action items.',
    key: 'meeting' as const,
  },
  {
    href: '/planner',
    icon: CalendarClock,
    title: 'Task Planner',
    description: 'Prioritize tasks into a realistic daily schedule.',
    key: 'planner' as const,
  },
  {
    href: '/research',
    icon: Search,
    title: 'Research Assistant',
    description: 'Concise briefs with clearly flagged uncertainty.',
    key: 'research' as const,
  },
]

export function Dashboard() {
  const [counts, setCounts] = useState<ActivityCounts>({
    email: 0,
    meeting: 0,
    planner: 0,
    research: 0,
  })

  useEffect(() => {
    const update = () => setCounts(getCounts())
    update()
    window.addEventListener('workflow-ai:activity', update)
    return () => window.removeEventListener('workflow-ai:activity', update)
  }, [])

  const total = counts.email + counts.meeting + counts.planner + counts.research

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          AI Skills Programme prototype
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Do focused work faster with WorkFlow AI
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed text-pretty sm:text-base">
          Draft emails, summarize meetings, plan your day, and research topics — all grounded only
          in the details you provide, with clear flags wherever information is missing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/workspace"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="size-4" />
            Open Smart Workspace
          </Link>
          <Link
            href="/assistant"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background/40 px-5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <MessageSquare className="size-4" />
            Ask the assistant
          </Link>
        </div>
      </section>

      {/* Activity summary */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Your activity
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <Card key={tool.key}>
              <CardContent className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between">
                  <tool.icon className="size-4 text-muted-foreground" />
                  <span className="text-2xl font-semibold tabular-nums">{counts[tool.key]}</span>
                </div>
                <p className="text-xs text-muted-foreground">{tool.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {total === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            No activity yet — pick a tool below to get started.
          </p>
        )}
      </section>

      {/* Tools */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Productivity tools
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <tool.icon className="size-4.5" />
                    </span>
                    <CardTitle className="flex-1">{tool.title}</CardTitle>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <CardDescription className="pt-1">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <ResponsibleNote>
        WorkFlow AI is running in no-API local demo mode. Outputs are created from the information you provide using transparent rules and templates, and may still require review. Always review important communications,
        decisions, and facts before acting on them.
      </ResponsibleNote>
    </div>
  )
}
