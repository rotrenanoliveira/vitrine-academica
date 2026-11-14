import type { ProjectStarsRepository } from '@/domain/project/application/repositories/project-stars-repository'
import type { ProjectStar } from '@/domain/project/enterprise/entities/project-star'

export class InMemoryProjectStarsRepository implements ProjectStarsRepository {
  public items: ProjectStar[] = []

  async findById(id: string): Promise<ProjectStar | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByProjectAndUser(projectId: string, userId: string): Promise<ProjectStar | null> {
    return (
      this.items.find((item) => item.projectId.toString() === projectId && item.userId.toString() === userId) ?? null
    )
  }

  async findActiveByProjectAndUser(projectId: string, userId: string): Promise<ProjectStar | null> {
    return (
      this.items.find(
        (item) => item.projectId.toString() === projectId && item.userId.toString() === userId && item.active,
      ) ?? null
    )
  }

  async findManyActiveByUserId(userId: string): Promise<ProjectStar[]> {
    return this.items
      .filter((item) => item.userId.toString() === userId && item.active)
      .sort((a, b) => b.ratedAt.getTime() - a.ratedAt.getTime())
  }

  async countActiveByProjectId(projectId: string): Promise<number> {
    return this.items.filter((item) => item.projectId.toString() === projectId && item.active).length
  }

  async sumWeightByProjectId(projectId: string): Promise<number> {
    return this.items
      .filter((item) => item.projectId.toString() === projectId && item.active)
      .reduce((sum, item) => sum + item.weight, 0)
  }

  async create(star: ProjectStar): Promise<void> {
    this.items.push(star)
  }

  async save(star: ProjectStar): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === star.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = star
  }
}
