'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/exposicao', label: 'Hoje' },
  { href: '/exposicao/em-breve', label: 'Em breve' },
]

export default function ExposicaoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
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
      {children}
    </div>
  )
}
