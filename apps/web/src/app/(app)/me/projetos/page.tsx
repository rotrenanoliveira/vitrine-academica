import type { Metadata } from 'next'
import Link from 'next/link'
import { MeBackLink } from '@/components/me/me-back-link'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { MeProjectsList } from './_components/me-projects-list'

export const metadata: Metadata = {
  title: 'Meus projetos',
}

export default async function MeProjectsPage() {
  await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MeBackLink />
        <Button nativeButton={false} render={<Link href="/projetos/novo" />}>
          Novo projeto
        </Button>
      </div>
      <MeProjectsList />
    </div>
  )
}
