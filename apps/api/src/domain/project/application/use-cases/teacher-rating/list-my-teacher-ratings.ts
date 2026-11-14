import { type Either, right } from '@/core/either'
import type { Project } from '../../../enterprise/entities/project'
import type { ProjectTeacherRating } from '../../../enterprise/entities/project-teacher-rating'
import type { ProjectTeacherRatingsRepository } from '../../repositories/project-teacher-ratings-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface ListMyTeacherRatingsUseCaseRequest {
  teacherId: string
}

export interface TeacherRatedProjectItem {
  project: Project
  rating: ProjectTeacherRating
}

type ListMyTeacherRatingsUseCaseResponse = Either<never, { items: TeacherRatedProjectItem[] }>

export class ListMyTeacherRatingsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTeacherRatingsRepository: ProjectTeacherRatingsRepository,
  ) {}

  async execute({ teacherId }: ListMyTeacherRatingsUseCaseRequest): Promise<ListMyTeacherRatingsUseCaseResponse> {
    const ratings = await this.projectTeacherRatingsRepository.findManyByTeacherId(teacherId)
    const projectIds = ratings.map((rating) => rating.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)
    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))

    const items = ratings
      .map((rating) => {
        const project = projectsById.get(rating.projectId.toString())

        if (!project) {
          return null
        }

        return { project, rating }
      })
      .filter((item): item is TeacherRatedProjectItem => item !== null)
      .sort((a, b) => b.rating.ratedAt.getTime() - a.rating.ratedAt.getTime())

    return right({ items })
  }
}
