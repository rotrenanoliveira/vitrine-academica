import { type Either, right } from '@/core/either'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import type { ProjectScheduledRepository } from '../../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface PublishScheduledProjectsUseCaseRequest {
  date?: Date
}

type PublishScheduledProjectsUseCaseResponse = Either<unknown, { projects: Project[] }>

export class PublishScheduledProjectsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
  ) {}

  async execute({
    date = new Date(),
  }: PublishScheduledProjectsUseCaseRequest = {}): Promise<PublishScheduledProjectsUseCaseResponse> {
    const schedules = await this.projectScheduledRepository.findManyReadyToPublish(date)
    const publishedProjects: Project[] = []

    for (const schedule of schedules) {
      const project = await this.projectsRepository.findById(schedule.projectId.toString())

      if (!project) {
        continue
      }

      if (project.status !== ProjectStatus.SCHEDULED) {
        continue
      }

      project.status = ProjectStatus.PUBLISHED
      await this.projectsRepository.save(project)

      publishedProjects.push(project)
    }

    return right({ projects: publishedProjects })
  }
}
