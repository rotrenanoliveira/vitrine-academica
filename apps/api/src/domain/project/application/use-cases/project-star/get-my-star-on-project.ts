import { type Either, left, right } from '@/core/either'
import type { ProjectStar } from '../../../enterprise/entities/project-star'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectStarsRepository } from '../../repositories/project-stars-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface GetMyStarOnProjectUseCaseRequest {
  projectId: string
  userId: string
}

type GetMyStarOnProjectUseCaseResponse = Either<ProjectNotFoundError, { star: ProjectStar | null }>

export class GetMyStarOnProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectStarsRepository: ProjectStarsRepository,
  ) {}

  async execute({ projectId, userId }: GetMyStarOnProjectUseCaseRequest): Promise<GetMyStarOnProjectUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    const star = await this.projectStarsRepository.findActiveByProjectAndUser(projectId, userId)

    return right({ star })
  }
}
