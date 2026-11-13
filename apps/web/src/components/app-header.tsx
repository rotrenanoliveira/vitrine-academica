import Image from 'next/image'
import Link from 'next/link'
import { AppNav } from '@/components/app-nav'
import { cn } from '@/lib/utils'

export const appShellPadding = 'px-5 sm:px-8 lg:px-16'

export function AppHeader({ padded = true }: { padded?: boolean }) {
  return (
    <header className={cn('flex items-start justify-between gap-4', padded && appShellPadding)}>
      <Link href="/" className="flex items-center justify-center gap-2">
        <Image src="/vitrine-icon.png" alt="Vitrine Acadêmica" width={48} height={48} />
        <p className="font-heading text-2xl font-semibold">Vitrine Acadêmica</p>
      </Link>

      <AppNav />
    </header>
  )
}
