import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorkFlow AI — Workplace Productivity Assistant',
  description: 'A no-API workplace productivity prototype for structured email drafting, meeting summaries, task planning, source-grounded research and smart workspace triage.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#12141c',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{ style: { background: 'oklch(0.21 0.028 258)', border: '1px solid oklch(1 0 0 / 11%)', color: 'oklch(0.97 0.005 250)' } }}
        />
      </body>
    </html>
  )
}
