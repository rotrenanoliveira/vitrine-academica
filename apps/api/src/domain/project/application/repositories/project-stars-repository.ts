import type { ProjectStar } from '../../enterprise/entities/project-star'

export interface ProjectStarsRepository {
  findById(id: string): Promise<ProjectStar | null>
  findByProjectAndUser(projectId: string, userId: string): Promise<ProjectStar | null>
  findActiveByProjectAndUser(projectId: string, userId: string): Promise<ProjectStar | null>
  findManyActiveByUserId(userId: string): Promise<ProjectStar[]>
  countActiveByProjectId(projectId: string): Promise<number>
  sumWeightByProjectId(projectId: string): Promise<number>

  create(star: ProjectStar): Promise<void>
  save(star: ProjectStar): Promise<void>
}
