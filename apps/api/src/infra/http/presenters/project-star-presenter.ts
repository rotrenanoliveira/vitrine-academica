import type { ProjectStar } from '@/domain/project/enterprise/entities/project-star'

export class ProjectStarPresenter {
  static toHTTP(projectStar: ProjectStar) {
    return {
      id: projectStar.id.toString(),
      projectId: projectStar.projectId.toString(),
      userId: projectStar.userId.toString(),
      weight: projectStar.weight,
      active: projectStar.active,
      ratedAt: projectStar.ratedAt.toISOString(),
      createdAt: projectStar.createdAt.toISOString(),
    }
  }
}
