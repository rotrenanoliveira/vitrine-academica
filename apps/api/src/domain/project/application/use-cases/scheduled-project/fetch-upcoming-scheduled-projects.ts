import { type Either, right } from '@/core/either'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import type { ProjectScheduledRepository } from '../../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

const UPCOMING_WINDOW_IN_DAYS = 7
const DAY_IN_MS = 24 * 60 * 60 * 1000

interface FetchUpcomingScheduledProjectsUseCaseRequest {
  date?: Date
}

export interface UpcomingScheduledProject {
  project: Project
  publishedIn: Date
}

type FetchUpcomingScheduledProjectsUseCaseResponse = Either<never, { scheduledProjects: UpcomingScheduledProject[] }>

export class FetchUpcomingScheduledProjectsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
  ) {}

  async execute({
    date = new Date(),
  }: FetchUpcomingScheduledProjectsUseCaseRequest = {}): Promise<FetchUpcomingScheduledProjectsUseCaseResponse> {
    const limit = new Date(date.getTime() + UPCOMING_WINDOW_IN_DAYS * DAY_IN_MS)

    const schedules = await this.projectScheduledRepository.findManyScheduledBetween(date, limit)

    if (schedules.length === 0) {
      return right({ scheduledProjects: [] })
    }

    const projectIds = schedules.map((schedule) => schedule.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)
    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))

    const scheduledProjects = schedules.flatMap((schedule) => {
      const project = projectsById.get(schedule.projectId.toString())

      if (!project || project.status !== ProjectStatus.SCHEDULED) {
        return []
      }

      return [{ project, publishedIn: schedule.publishedIn }]
    })

    return right({ scheduledProjects })
  }
}
