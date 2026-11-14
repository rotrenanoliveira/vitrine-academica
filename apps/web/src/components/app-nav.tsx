'use client'

import { Menu01Icon, User03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const links = [
  { href: '/projetos', label: 'Projetos' },
  { href: '/exposicao', label: 'Exposição' },
  { href: '/destaques', label: 'Destaques' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/chamados', label: 'Chamados' },
  { href: '/instituicoes', label: 'Instituições' },
  { href: '/pesquisas-cientificas', label: 'OpenAlex' },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  href,
  label,
  pathname,
  className,
}: {
  href: string
  label: string
  pathname: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: 'outline' }),
        isActive(pathname, href) && 'bg-primary text-primary-foreground',
        className,
      )}
    >
      {label}
    </Link>
  )
}

function ProfileLink({ pathname, className }: { pathname: string; className?: string }) {
  return (
    <Link
      href="/me"
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'size-10',
        isActive(pathname, '/me') && 'bg-primary text-primary-foreground',
        className,
      )}
    >
      <HugeiconsIcon icon={User03Icon} className="size-5" />
      <span className="sr-only">Meu perfil</span>
    </Link>
  )
}

export function AppNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <nav className="hidden items-center gap-2 lg:flex" aria-label="Principal">
        {links.map((link) => (
          <NavLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
        ))}
        <ProfileLink pathname={pathname} />
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu de navegação" />}
        >
          <HugeiconsIcon icon={Menu01Icon} className="size-5" />
        </SheetTrigger>

        <SheetContent side="right" className="gap-0">
          <SheetHeader>
            <SheetTitle>Navegação</SheetTitle>
            <SheetDescription className="sr-only">Links principais do site</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-8 pb-4" aria-label="Principal">
            {links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                pathname={pathname}
                className="h-11 w-full justify-start"
              />
            ))}
          </nav>

          <SheetFooter>
            <Link
              href="/me"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-11 w-full justify-start gap-3',
                isActive(pathname, '/me') && 'bg-primary text-primary-foreground',
              )}
            >
              <HugeiconsIcon icon={User03Icon} className="size-5" />
              Meu perfil
            </Link>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
