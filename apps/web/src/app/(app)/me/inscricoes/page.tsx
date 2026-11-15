import type { Metadata } from 'next'
import { MeBackLink } from '@/components/me/me-back-link'
import { requireUser } from '@/server/auth/require-user'
import { MeEventRegistrationsList } from './_components/me-event-registrations-list'

export const metadata: Metadata = {
  title: 'Minhas inscrições',
}

export default async function MeEventRegistrationsPage() {
  await requireUser()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 py-8">
      <MeBackLink />
      <MeEventRegistrationsList />
    </div>
  )
}
