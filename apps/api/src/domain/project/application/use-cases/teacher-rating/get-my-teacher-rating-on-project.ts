import { type Either, left, right } from '@/core/either'
import type { ProjectTeacherRating } from '../../../enterprise/entities/project-teacher-rating'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectTeacherRatingsRepository } from '../../repositories/project-teacher-ratings-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface GetMyTeacherRatingOnProjectUseCaseRequest {
  projectId: string
  teacherId: string
}

type GetMyTeacherRatingOnProjectUseCaseResponse = Either<ProjectNotFoundError, { rating: ProjectTeacherRating | null }>

export class GetMyTeacherRatingOnProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTeacherRatingsRepository: ProjectTeacherRatingsRepository,
  ) {}

  async execute({
    projectId,
    teacherId,
  }: GetMyTeacherRatingOnProjectUseCaseRequest): Promise<GetMyTeacherRatingOnProjectUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    const rating = await this.projectTeacherRatingsRepository.findByProjectAndTeacher(projectId, teacherId)

    return right({ rating })
  }
}
