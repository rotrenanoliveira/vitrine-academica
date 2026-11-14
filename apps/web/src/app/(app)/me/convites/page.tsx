import type { Metadata } from 'next'
import { MeBackLink } from '@/components/me/me-back-link'
import { requireUser } from '@/server/auth/require-user'
import { ProjectInvitationsList } from './_components/project-invitations-list'

export const metadata: Metadata = {
  title: 'Convites',
  description: 'Convites para participar de projetos como coautor',
}

export default async function MeInvitationsPage() {
  await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 py-8">
      <MeBackLink />
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold">Convites de coautoria</h1>
        <p className="text-muted-foreground">Convites para participar de projetos como coautor.</p>
      </div>
      <ProjectInvitationsList />
    </div>
  )
}
