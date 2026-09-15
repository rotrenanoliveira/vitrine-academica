'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from './ui/button'

const links = [
  { href: '/exposicao', label: 'Exposição do dia' },
  { href: '/projetos', label: 'Projetos' },
  { href: '/instituicoes', label: 'Instituições' },
  { href: '/conta', label: 'Conta' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <aside className="space-x-2">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(buttonVariants({ variant: 'outline' }), active && 'bg-primary text-primary-foreground')}
          >
            {link.label}
          </Link>
        )
      })}
    </aside>
  )
}
