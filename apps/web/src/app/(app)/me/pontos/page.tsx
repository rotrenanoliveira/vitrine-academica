import type { Metadata } from 'next'
import { MeBackLink } from '@/components/me/me-back-link'
import { requireUser } from '@/server/auth/require-user'
import { MePointsView } from './_components/me-points-view'

export const metadata: Metadata = {
  title: 'Pontos e apoios',
}

export default async function MePointsPage() {
  await requireUser()

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8">
        <MeBackLink />
      </div>
      <MePointsView />
    </div>
  )
}
