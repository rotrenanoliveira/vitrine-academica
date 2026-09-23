import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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
    private readonly registerLog: RegisterLogUseCase,
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

    for (const project of publishedProjects) {
      await this.registerLog.execute({
        actorId: 'internal-system',
        sessionId: null,
        action: AuditLogAction.CREATE,
        resource: 'project.scheduled',
        resourceId: project.id.toString(),
        text: `Projeto ${project.id.toString()} publicado com sucesso.`,
        status: AuditLogStatus.SUCCESS,
        diff: null,
      })
    }

    return right({ projects: publishedProjects })
  }
}
