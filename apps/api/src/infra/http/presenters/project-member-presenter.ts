import type { ProjectMember } from '@/domain/project/enterprise/entities/project-member'

export class ProjectMemberPresenter {
  static toHTTP(projectMember: ProjectMember) {
    return {
      id: projectMember.id.toString(),
      projectId: projectMember.projectId.toString(),
      userId: projectMember.userId.toString(),
      status: projectMember.status,
      createdAt: projectMember.createdAt.toISOString(),
    }
  }
}
