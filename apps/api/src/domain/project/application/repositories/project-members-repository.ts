import type { ProjectMember, ProjectMemberStatus } from '../../enterprise/entities/project-member'

export interface ProjectMembersRepository {
  findById(id: string): Promise<ProjectMember | null>

  findByProjectAndUser(projectId: string, userId: string): Promise<ProjectMember | null>

  findManyByProjectId(projectId: string): Promise<ProjectMember[]>

  findManyByUserId(userId: string, status?: ProjectMemberStatus): Promise<ProjectMember[]>

  create(projectMember: ProjectMember): Promise<void>
  save(projectMember: ProjectMember): Promise<void>
  delete(projectMember: ProjectMember): Promise<void>
}
