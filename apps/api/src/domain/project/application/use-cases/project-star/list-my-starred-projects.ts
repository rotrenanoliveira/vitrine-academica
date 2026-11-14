import { type Either, right } from '@/core/either'
import type { Project } from '../../../enterprise/entities/project'
import type { ProjectStar } from '../../../enterprise/entities/project-star'
import type { ProjectStarsRepository } from '../../repositories/project-stars-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface ListMyStarredProjectsUseCaseRequest {
  userId: string
}

export interface StarredProjectItem {
  project: Project
  star: ProjectStar
}

type ListMyStarredProjectsUseCaseResponse = Either<never, { items: StarredProjectItem[] }>

export class ListMyStarredProjectsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectStarsRepository: ProjectStarsRepository,
  ) {}

  async execute({ userId }: ListMyStarredProjectsUseCaseRequest): Promise<ListMyStarredProjectsUseCaseResponse> {
    const stars = await this.projectStarsRepository.findManyActiveByUserId(userId)
    const projectIds = stars.map((star) => star.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)
    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))

    const items = stars
      .map((star) => {
        const project = projectsById.get(star.projectId.toString())

        if (!project) {
          return null
        }

        return { project, star }
      })
      .filter((item): item is StarredProjectItem => item !== null)
      .sort((a, b) => b.star.ratedAt.getTime() - a.star.ratedAt.getTime())

    return right({ items })
  }
}
