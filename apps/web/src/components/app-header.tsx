import Image from 'next/image'
import Link from 'next/link'
import { AppNav } from '@/components/app-nav'
import { cn } from '@/lib/utils'

export const appShellPadding = 'px-5 sm:px-8 lg:px-16'

export function AppHeader({ padded = true }: { padded?: boolean }) {
  return (
    <header className={cn('flex items-center justify-between gap-4', padded && appShellPadding)}>
      <Link href="/" className="flex min-w-0 items-center justify-center gap-2">
        <Image
          src="/vitrine-icon.png"
          alt="Vitrine Acadêmica"
          width={48}
          height={48}
          className="size-10 shrink-0 sm:size-12"
        />
        <p className="font-heading truncate text-lg font-semibold sm:text-2xl">Vitrine Acadêmica</p>
      </Link>

      <AppNav />
    </header>
  )
}
