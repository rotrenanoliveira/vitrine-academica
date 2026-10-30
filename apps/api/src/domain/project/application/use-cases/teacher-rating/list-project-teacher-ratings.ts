import { type Either, left, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { ProjectTeacherRating } from '../../../enterprise/entities/project-teacher-rating'
import type { RatingCriterion } from '../../../enterprise/entities/rating-criterion'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectTeacherRatingsRepository } from '../../repositories/project-teacher-ratings-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'
import type { RatingCriteriaRepository } from '../../repositories/rating-criteria-repository'

interface ListProjectTeacherRatingsUseCaseRequest {
  projectId: string
}

export interface ProjectTeacherRatingListItem {
  teacherRating: ProjectTeacherRating
  teacher: {
    id: string
    name: string
  }
}

type ListProjectTeacherRatingsUseCaseResponse = Either<
  ProjectNotFoundError,
  {
    criteria: RatingCriterion[]
    items: ProjectTeacherRatingListItem[]
  }
>

export class ListProjectTeacherRatingsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTeacherRatingsRepository: ProjectTeacherRatingsRepository,
    private readonly ratingCriteriaRepository: RatingCriteriaRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    projectId,
  }: ListProjectTeacherRatingsUseCaseRequest): Promise<ListProjectTeacherRatingsUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    const [ratings, criteria] = await Promise.all([
      this.projectTeacherRatingsRepository.findManyByProjectId(projectId),
      this.ratingCriteriaRepository.findActiveValid(),
    ])

    const teachers = await this.usersRepository.findManyByIds(ratings.map((rating) => rating.teacherId.toString()))
    const teachersById = new Map(teachers.map((teacher) => [teacher.id.toString(), teacher]))

    const items = ratings
      .map((teacherRating) => {
        const teacher = teachersById.get(teacherRating.teacherId.toString())

        if (!teacher) {
          return null
        }

        return {
          teacherRating,
          teacher: {
            id: teacher.id.toString(),
            name: teacher.name,
          },
        }
      })
      .filter((item): item is ProjectTeacherRatingListItem => item !== null)
      .sort((a, b) => b.teacherRating.ratedAt.getTime() - a.teacherRating.ratedAt.getTime())

    return right({ criteria, items })
  }
}
