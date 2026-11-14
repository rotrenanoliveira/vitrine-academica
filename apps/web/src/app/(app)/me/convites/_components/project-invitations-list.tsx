'use client'

import { useQuery } from '@tanstack/react-query'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { InvitationPreviewCard } from '@/components/project/invitation-preview-card'
import { listMyProjectInvitations } from '@/server/http/routes/projects/list-my-project-invitations'

export function ProjectInvitationsList() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'invitations'],
    queryFn: () => listMyProjectInvitations(),
  })

  if (isPending) {
    return <MeCardsSkeleton count={6} />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os convites.</p>
  }

  if (data.invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">Você não tem convites.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.invitations.map((invitation) => (
        <InvitationPreviewCard key={invitation.id} invitation={invitation} />
      ))}
    </div>
  )
}
