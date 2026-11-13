'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/eventos', label: 'Abertos' },
  { href: '/eventos/em-votacao', label: 'Em votação' },
  { href: '/eventos/encerrados', label: 'Encerrados' },
]

export function EventsSectionNav() {
  const pathname = usePathname()

  return (
    <nav className="flex w-full flex-wrap items-center gap-2" aria-label="Seções de eventos">
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

      <Link href="/eventos/novo" className={cn(buttonVariants({ variant: 'outline' }), 'ml-auto')}>
        Novo evento
      </Link>
    </nav>
  )
}
