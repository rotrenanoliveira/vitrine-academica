import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { MeBackLink } from '@/components/me/me-back-link'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { MyMembershipsList } from './_components/my-memberships-list'

export const metadata: Metadata = {
  title: 'Minhas instituições',
  description: 'Instituições das quais você faz parte.',
}

export default async function MeInstitutionsPage() {
  await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 py-8">
      <MeBackLink />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Minhas instituições</h1>
          <p className="text-sm text-muted-foreground">Membresias vinculadas à sua conta.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/me/instituicoes/solicitar" />}>
            Solicitar entrada
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/instituicoes" />}>
            Explorar instituições
          </Button>
        </div>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando instituições…</p>}>
        <MyMembershipsList />
      </Suspense>
    </div>
  )
}
