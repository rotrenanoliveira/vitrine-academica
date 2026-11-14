import type { Metadata } from 'next'
import Link from 'next/link'
import { MeBackLink } from '@/components/me/me-back-link'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { MeCallsList } from './_components/me-calls-list'

export const metadata: Metadata = {
  title: 'Meus chamados',
}

export default async function MeCallsPage() {
  await requireUser()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MeBackLink />
        <Button nativeButton={false} render={<Link href="/chamados/novo" />}>
          Novo chamado
        </Button>
      </div>
      <MeCallsList />
    </div>
  )
}
