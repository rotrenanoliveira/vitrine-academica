import type { ProjectMemberItem } from '@/domain/project/application/use-cases/project-member/list-project-members'

export class ProjectMemberListItemPresenter {
  static toHTTP({ projectMember, user }: ProjectMemberItem) {
    return {
      id: projectMember.id.toString(),
      userId: user.id.toString(),
      name: user.name,
      status: projectMember.status,
      createdAt: projectMember.createdAt.toISOString(),
    }
  }
}
