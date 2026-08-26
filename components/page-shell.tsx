'use client'

import { Check, Copy, Info, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PageContainer({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10', className)}
      {...props}
    />
  )
}

export function PageHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="size-5.5" />
      </span>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground leading-relaxed text-pretty">
          {description}
        </p>
      </div>
    </div>
  )
}

export function SubmitButton({
  loading,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button
      type="submit"
      disabled={loading || props.disabled}
      className={cn('h-11 px-6', className)}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  )
}

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className={className}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {label}
    </Button>
  )
}

export function ResponsibleNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-xs text-muted-foreground leading-relaxed">
      <Info className="mt-0.5 size-3.5 shrink-0 text-accent" />
      <span>{children}</span>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}
