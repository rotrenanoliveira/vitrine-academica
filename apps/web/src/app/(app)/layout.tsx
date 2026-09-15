import Image from 'next/image'
import Link from 'next/link'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { AppNav } from '@/components/app-nav'

export default function AppLayout({ children, sheet }: { children: React.ReactNode; sheet: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <Link href="/">
              <Image src="/vitrine-icon.png" alt="Vitrine Acadêmica" width={48} height={48} />
            </Link>
            <div className="space-y-1">
              <p className="font-heading text-2xl font-semibold">Vitrine Acadêmica</p>
            </div>
          </div>

          <AppNav />
        </header>

        <main className="space-y-4">
          {children}
          {sheet}
        </main>
      </div>
    </NuqsAdapter>
  )
}
