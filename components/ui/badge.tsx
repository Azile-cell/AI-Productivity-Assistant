import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'primary' | 'accent' | 'high' | 'medium' | 'low' | 'muted'

const variants: Record<Variant, string> = {
  default: 'border-border bg-secondary text-secondary-foreground',
  primary: 'border-primary/30 bg-primary/15 text-primary',
  accent: 'border-accent/30 bg-accent/15 text-accent',
  high: 'border-destructive/30 bg-destructive/15 text-destructive',
  medium: 'border-accent/30 bg-accent/15 text-accent',
  low: 'border-primary/30 bg-primary/15 text-primary',
  muted: 'border-border bg-muted text-muted-foreground',
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'span'> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function priorityVariant(priority: string): Variant {
  const p = priority.toLowerCase()
  if (p === 'high') return 'high'
  if (p === 'medium') return 'medium'
  if (p === 'low') return 'low'
  return 'muted'
}
