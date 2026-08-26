'use client'

import { History, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageContainer, PageHeader } from '@/components/page-shell'
import {
  clearHistory,
  deleteHistoryItem,
  getHistory,
  type HistoryItem,
} from '@/lib/activity'

const LABELS = {
  email: 'Email Draft',
  meeting: 'Meeting Summary',
  planner: 'Task Plan',
  research: 'Research Brief',
} as const

export default function Page() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [selected, setSelected] = useState<HistoryItem | null>(null)

  function refresh() {
    setItems(getHistory())
  }

  useEffect(() => {
    refresh()
    window.addEventListener('workflow-ai:activity', refresh)
    return () => window.removeEventListener('workflow-ai:activity', refresh)
  }, [])

  return (
    <PageContainer>
      <PageHeader
        icon={History}
        title="Activity History"
        description="Recent email drafts, meeting summaries, task plans, and research briefs saved locally in this browser."
      />

      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearHistory()
            setSelected(null)
            refresh()
          }}
          disabled={!items.length}
        >
          <Trash2 className="size-4" />
          Clear history
        </Button>
      </div>

      {!items.length ? (
        <EmptyState icon={History}>
          No saved activity yet. Completed outputs from the main productivity tools will appear here.
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="flex flex-col gap-3 lg:col-span-2">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {LABELS[item.type]}
                      </p>
                      <CardTitle className="mt-1 truncate text-sm">{item.title}</CardTitle>
                    </div>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Delete history item"
                      onClick={() => {
                        deleteHistoryItem(item.id)
                        if (selected?.id === item.id) setSelected(null)
                        refresh()
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.preview}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <Button type="button" size="sm" variant="outline" onClick={() => setSelected(item)}>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{selected ? selected.title : 'Preview'}</CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/90">
                  {selected.content}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">Select a history item to view its full saved output.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
