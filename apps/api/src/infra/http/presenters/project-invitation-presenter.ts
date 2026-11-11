import type { ProjectInvitationItem } from '@/domain/project/application/use-cases/project-member/list-my-project-invitations'

export class ProjectInvitationPresenter {
  static toHTTP({ projectMember, project, owner }: ProjectInvitationItem) {
    return {
      id: projectMember.id.toString(),
      status: projectMember.status,
      createdAt: projectMember.createdAt.toISOString(),
      project: {
        id: project.id.toString(),
        title: project.title,
      },
      // Só o nome de quem convidou: nenhum outro dado do dono é exposto
      owner: owner ? { id: owner.id.toString(), name: owner.name } : null,
    }
  }
}
