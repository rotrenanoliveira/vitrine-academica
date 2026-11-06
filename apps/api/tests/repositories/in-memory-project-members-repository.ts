import type { ProjectMembersRepository } from '@/domain/project/application/repositories/project-members-repository'
import type { ProjectMember, ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'

export class InMemoryProjectMembersRepository implements ProjectMembersRepository {
  public items: ProjectMember[] = []

  async findById(id: string): Promise<ProjectMember | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByProjectAndUser(projectId: string, userId: string): Promise<ProjectMember | null> {
    return (
      this.items.find((item) => item.projectId.toString() === projectId && item.userId.toString() === userId) ?? null
    )
  }

  async findManyByProjectId(projectId: string): Promise<ProjectMember[]> {
    return this.items
      .filter((item) => item.projectId.toString() === projectId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async findManyByUserId(userId: string, status?: ProjectMemberStatus): Promise<ProjectMember[]> {
    return this.items
      .filter((item) => item.userId.toString() === userId && (status === undefined || item.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async create(projectMember: ProjectMember): Promise<void> {
    this.items.push(projectMember)
  }

  async save(projectMember: ProjectMember): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === projectMember.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = projectMember
  }

  async delete(projectMember: ProjectMember): Promise<void> {
    this.items = this.items.filter((item) => item.id.toString() !== projectMember.id.toString())
  }
}
