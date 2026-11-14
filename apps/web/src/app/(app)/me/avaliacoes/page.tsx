import type { Metadata } from 'next'
import { MeBackLink } from '@/components/me/me-back-link'
import { requireUser } from '@/server/auth/require-user'
import { MeRatingsList } from './_components/me-ratings-list'

export const metadata: Metadata = {
  title: 'Projetos que avaliei',
}

export default async function MeRatingsPage() {
  await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 py-8">
      <MeBackLink />
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold">Projetos que avaliei</h1>
        <p className="text-muted-foreground">
          Lista dos projetos em que você registrou avaliação docente, com média e notas por critério.
        </p>
      </div>
      <MeRatingsList />
    </div>
  )
}
