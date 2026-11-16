import { AppHeader, appShellPadding } from '@/components/app-header'
import { cn } from '@/lib/utils'

export default function AppLayout({ children, sheet }: { children: React.ReactNode; sheet: React.ReactNode }) {
  return (
    <div className={cn('mx-auto flex min-h-screen w-full max-w-dvw flex-col gap-8 py-8', appShellPadding)}>
      <AppHeader padded={false} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        {children}
        {sheet}
      </main>
    </div>
  )
}
