import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { listProjectMembers } from '@/server/http/routes/projects/list-project-members'
import { ProjectMembersList } from './project-members-list'

type ProjectMembersSectionProps = {
  projectId: string
  projectSlug: string
  isOwner: boolean
  currentUserId: string | null
}

export async function ProjectMembersSection({
  projectId,
  projectSlug,
  isOwner,
  currentUserId,
}: ProjectMembersSectionProps) {
  const { members } = await listProjectMembers({ projectId })

  const isCoauthor = Boolean(currentUserId) && !isOwner && members.some((member) => member.userId === currentUserId)

  return (
    <>
      {isCoauthor && (
        <div>
          <Button nativeButton={false} variant="outline" render={<Link href={`/projetos/${projectSlug}/editar`} />}>
            Gerenciar / Editar
          </Button>
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
