import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { listProjectMembers } from '@/server/http/routes/projects/list-project-members'
import type { ProjectStatus } from '@/utils/type'
import { FormInviteProjectMember } from './form-invite-project-member'
import { ProjectMembersList } from './project-members-list'

type ProjectMembersSectionProps = {
  projectId: string
  projectStatus: ProjectStatus
  isOwner: boolean
  currentUserId: string
}

export async function ProjectMembersSection({
  projectId,
  projectStatus,
  isOwner,
  currentUserId,
}: ProjectMembersSectionProps) {
  const { members } = await listProjectMembers({ projectId })

  const canInvite = isOwner && projectStatus !== 'ARCHIVED'

  const isCoauthor = !isOwner && members.some((member) => member.userId === currentUserId)

  return (
    <>
      {isCoauthor && (
        <div>
          <Button nativeButton={false} variant="outline" render={<Link href={`/projetos/${projectId}/editar`} />}>
            Gerenciar / Editar
          </Button>
        </div>
      )}

      {canInvite && (
        <div className="border border-border p-4">
          <FormInviteProjectMember projectId={projectId} />
        </div>
      )}

      {(isOwner || members.length > 0) && (
        <div className="border border-border p-4">
          <ProjectMembersList members={members} isOwner={isOwner} />
        </div>
      )}
    </>
  )
}
