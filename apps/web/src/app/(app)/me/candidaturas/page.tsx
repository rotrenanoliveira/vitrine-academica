import type { Metadata } from 'next'
import { MeBackLink } from '@/components/me/me-back-link'
import { requireUser } from '@/server/auth/require-user'
import { MeApplicationsList } from './_components/me-applications-list'

export const metadata: Metadata = {
  title: 'Minhas candidaturas',
}

export default async function MeApplicationsPage() {
  await requireUser()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 py-8">
      <MeBackLink />
      <MeApplicationsList />
    </div>
  )
}
