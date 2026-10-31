import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectRating } from '../../../enterprise/entities/project-rating'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectStarsRepository } from '../../repositories/project-stars-repository'
import type { ProjectTeacherRatingsRepository } from '../../repositories/project-teacher-ratings-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface GetProjectRatingsUseCaseRequest {
  projectId: string
}

type GetProjectRatingsUseCaseResponse = Either<ProjectNotFoundError, { rating: ProjectRating }>

export class GetProjectRatingsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectStarsRepository: ProjectStarsRepository,
    private readonly projectTeacherRatingsRepository: ProjectTeacherRatingsRepository,
  ) {}

  async execute({ projectId }: GetProjectRatingsUseCaseRequest): Promise<GetProjectRatingsUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    const [starsCount, starsWeightedScore, teacherRatingsCount, teacherAverage, teacherScoresByCriterion] =
      await Promise.all([
        this.projectStarsRepository.countActiveByProjectId(projectId),
        this.projectStarsRepository.sumWeightByProjectId(projectId),
        this.projectTeacherRatingsRepository.countByProjectId(projectId),
        this.projectTeacherRatingsRepository.averageOverallByProjectId(projectId),
        this.projectTeacherRatingsRepository.averagesByCriterionForProject(projectId),
      ])

    const rating = ProjectRating.create({
      projectId: new UniqueEntityId(projectId),
      starsCount,
      starsWeightedScore,
      teacherRatingsCount,
      teacherAverage,
      teacherScoresByCriterion,
    })

    return right({ rating })
  }
}
