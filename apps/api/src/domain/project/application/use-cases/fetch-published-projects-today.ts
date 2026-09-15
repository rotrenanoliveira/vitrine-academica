import { type Either, right } from '@/core/either'
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
    const schedules = await this.projectScheduledRepository.findManyReadyToPublish(date)

    const projectIds = schedules.map((schedule) => schedule.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)

    for (const project of projects) {
      project.status = ProjectStatus.PUBLISHED
      await this.projectsRepository.save(project)
    }

    return right({ projects })
  }
}
