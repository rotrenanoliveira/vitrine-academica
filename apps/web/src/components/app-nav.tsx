'use client'

import { User03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from './ui/button'

const links = [
  { href: '/projetos', label: 'Projetos' },
  { href: '/exposicao', label: 'Exposição' },
  { href: '/destaques', label: 'Destaques' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/chamados', label: 'Chamados' },
  { href: '/instituicoes', label: 'Instituições' },
  { href: '/pesquisas-cientificas', label: 'OpenAlex' },
  // { href: '/conta', label: 'Minha Conta' },
  // { href: '/projetos/convites', label: 'Convites' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-wrap items-center gap-2">
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

      <Link
        href="/conta"
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'size-10',
          pathname === 'conta' || (pathname.startsWith('/conta') && 'bg-primary text-primary-foreground'),
        )}
      >
        <HugeiconsIcon icon={User03Icon} className="size-5" />
      </Link>
    </aside>
  )
}
