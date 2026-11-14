import Link from 'next/link'
import { BeigeActionCard } from '@/components/me/beige-action-card'
import { ProjectInvitationActions } from '@/components/project/project-invitation-actions'
import type { ProjectInvitation, ProjectMemberStatus } from '@/utils/project-member-types'

const invitationDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

const answeredLabels: Record<Exclude<ProjectMemberStatus, 'PENDING'>, string> = {
  ACCEPTED: 'Convite aceito',
  REJECTED: 'Convite recusado',
}

type InvitationPreviewCardProps = {
  invitation: ProjectInvitation
}

export function InvitationPreviewCard({ invitation }: InvitationPreviewCardProps) {
  return (
    <BeigeActionCard
      title={
        <Link href={`/projetos/${invitation.project.slug}`} className="underline-offset-4 hover:underline">
          {invitation.project.title}
        </Link>
      }
      meta={
        <>
          <p>{invitation.owner ? `Convite de ${invitation.owner.name}` : 'Convite'}</p>
          <p>{invitationDateFormatter.format(new Date(invitation.createdAt))}</p>
        </>
      }
      actions={
        invitation.status === 'PENDING' ? (
          <ProjectInvitationActions
            invitationId={invitation.id}
            projectId={invitation.project.id}
            projectSlug={invitation.project.slug}
          />
        ) : (
          <p className="text-xs text-muted-foreground">{answeredLabels[invitation.status]}</p>
        )
      }
    />
  )
}
