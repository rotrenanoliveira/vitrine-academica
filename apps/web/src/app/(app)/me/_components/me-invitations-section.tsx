'use client'

import { useQuery } from '@tanstack/react-query'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { InvitationPreviewCard } from '@/components/project/invitation-preview-card'
import { listMyProjectInvitations } from '@/server/http/routes/projects/list-my-project-invitations'

const PREVIEW_LIMIT = 3

export function MeInvitationsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'invitations'],
    queryFn: () => listMyProjectInvitations(),
  })

  if (isPending) {
    return (
      <MeSection
        id="me-convites"
        eyebrow="convites"
        title="Convites de coautoria"
        href="/me/convites"
        linkLabel="Ver todos os convites"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError) {
    return (
      <MeSection
        id="me-convites"
        eyebrow="convites"
        title="Convites de coautoria"
        href="/me/convites"
        linkLabel="Ver todos os convites"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar os convites.</p>
      </MeSection>
    )
  }

  const preview = data.invitations.slice(0, PREVIEW_LIMIT)

  return (
    <MeSection
      id="me-convites"
      eyebrow={`convites · ${String(data.invitations.length).padStart(2, '0')}`}
      title="Convites de coautoria"
      href="/me/convites"
      linkLabel="Ver todos os convites"
      isEmpty={preview.length === 0}
      emptyMessage="Você não tem convites."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((invitation) => (
          <InvitationPreviewCard key={invitation.id} invitation={invitation} />
        ))}
      </div>
    </MeSection>
  )
}
