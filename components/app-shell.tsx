'use client'

import { Menu, Workflow, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SidebarNav } from '@/components/sidebar-nav'
import { cn } from '@/lib/utils'

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Workflow className="size-4.5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">WorkFlow AI</span>
        <span className="text-xs text-muted-foreground">Productivity Assistant</span>
      </span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-svh w-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Local demo · No external API
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-sidebar">
            <div className="flex items-center justify-between">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                className="mr-3"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className={cn('flex min-w-0 flex-1 flex-col lg:pl-64')}>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Workflow className="size-4 text-primary" />
            WorkFlow AI
          </span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
