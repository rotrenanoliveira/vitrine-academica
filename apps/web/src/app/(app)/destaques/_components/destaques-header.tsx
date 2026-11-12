'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/destaques/banca', label: 'Banca' },
  { href: '/destaques/comunidade', label: 'Comunidade' },
]

export function DestaquesHeader() {
  const pathname = usePathname()

  return (
    <nav className="space-x-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            pathname === tab.href && 'bg-primary text-primary-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
