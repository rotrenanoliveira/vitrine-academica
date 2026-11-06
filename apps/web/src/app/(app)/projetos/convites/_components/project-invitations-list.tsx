import { ProjectInvitationActions } from '@/components/project/project-invitation-actions'
import { listMyProjectInvitations } from '@/server/http/routes/projects/list-my-project-invitations'
import type { ProjectMemberStatus } from '@/utils/project-member-types'

const invitationDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

const answeredLabels: Record<Exclude<ProjectMemberStatus, 'PENDING'>, string> = {
  ACCEPTED: 'Convite aceito',
  REJECTED: 'Convite recusado',
}

export async function ProjectInvitationsList() {
  const { invitations } = await listMyProjectInvitations()

  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">Você não tem convites.</p>
  }

  return (
    <ul className="divide-y divide-border border border-border">
      {invitations.map((invitation) => (
        <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading text-lg font-medium">{invitation.project.title}</h2>
            <p className="text-xs text-muted-foreground">
              {invitation.owner ? `Convite de ${invitation.owner.name}` : 'Convite'} em{' '}
              {invitationDateFormatter.format(new Date(invitation.createdAt))}
            </p>
          </div>

          {invitation.status === 'PENDING' ? (
            <ProjectInvitationActions invitationId={invitation.id} projectId={invitation.project.id} />
          ) : (
            <span className="shrink-0 text-xs text-muted-foreground">{answeredLabels[invitation.status]}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
