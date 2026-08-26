'use client'

import {
  LayoutDashboard,
  Mail,
  FileText,
  CalendarClock,
  Search,
  Sparkles,
  MessageSquare,
  History,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Tools',
    items: [
      { href: '/email', label: 'Email Generator', icon: Mail },
      { href: '/meetings', label: 'Meeting Summarizer', icon: FileText },
      { href: '/planner', label: 'Task Planner', icon: CalendarClock },
      { href: '/research', label: 'Research Assistant', icon: Search },
      { href: '/workspace', label: 'Smart Workspace', icon: Sparkles },
    ],
  },
  {
    label: 'More',
    items: [
      { href: '/assistant', label: 'Assistant Chat', icon: MessageSquare },
      { href: '/history', label: 'Activity History', icon: History },
      { href: '/responsible-ai', label: 'Responsible AI', icon: ShieldCheck },
    ],
  },
] as const

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
