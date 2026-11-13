import Link from 'next/link'
import type { ProjectMemberListItem, ProjectMemberStatus } from '@/utils/project-member-types'

const statusLabels: Record<ProjectMemberStatus, string> = {
  PENDING: 'Convite pendente',
  ACCEPTED: 'Coautor',
  REJECTED: 'Convite recusado',
}

type ProjectMembersListProps = {
  members: ProjectMemberListItem[]
  isOwner: boolean
}

export function ProjectMembersList({ members, isOwner }: ProjectMembersListProps) {
  if (members.length === 0 && !isOwner) {
    return null
  }

  return (
    <section className="space-y-3">
      <h3 className="font-heading text-lg font-semibold">{isOwner ? 'Coautores e convites' : 'Coautores'}</h3>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum convite enviado ainda.</p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link
                href={`/p/${member.userId}`}
                className="min-w-0 truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                {member.name}
              </Link>
              {isOwner && <span className="shrink-0 text-xs text-muted-foreground">{statusLabels[member.status]}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
