import { type Either, right } from '@/core/either'
import { brazilDayRange } from '@/core/utils/brazil-day-range'
import { type Project, ProjectStatus } from '../../enterprise/entities/project'
import type { ProjectScheduledRepository } from '../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../repositories/projects-repositories'

interface FetchPublishedProjectsTodayUseCaseRequest {
  date?: Date
}

type FetchPublishedProjectsTodayUseCaseResponse = Either<never, { projects: Project[] }>

export class FetchPublishedProjectsTodayUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
  ) {}

  async execute({
    date = new Date(),
  }: FetchPublishedProjectsTodayUseCaseRequest = {}): Promise<FetchPublishedProjectsTodayUseCaseResponse> {
    const { start, end } = brazilDayRange(date)

    const schedules = await this.projectScheduledRepository.findManyInRange(start, end)

    if (schedules.length === 0) {
      return right({ projects: [] })
    }

    const projectIds = schedules.map((schedule) => schedule.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)
    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))

    const publishedToday = schedules.flatMap((schedule) => {
      const project = projectsById.get(schedule.projectId.toString())

      if (!project || project.status !== ProjectStatus.PUBLISHED) {
        return []
      }

      return [project]
    })

    return right({ projects: publishedToday })
  }
}