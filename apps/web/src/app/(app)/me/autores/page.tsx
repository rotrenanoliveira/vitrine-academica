import type { Metadata } from 'next'
import { MeBackLink } from '@/components/me/me-back-link'
import { requireUser } from '@/server/auth/require-user'
import { MeAuthorsList } from './_components/me-authors-list'

export const metadata: Metadata = {
  title: 'Autores que acompanho',
}

export default async function MeAuthorsPage() {
  await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 py-8">
      <MeBackLink />
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold">Autores que acompanho</h1>
        <p className="text-muted-foreground">Receba um e-mail quando estes autores publicarem novos projetos.</p>
      </div>
      <MeAuthorsList />
    </div>
  )
}
