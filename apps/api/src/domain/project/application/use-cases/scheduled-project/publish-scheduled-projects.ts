import { type Either, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { PublicationNotifier } from '@/domain/project/application/notifier/publication-notifier'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import type { ProjectScheduled } from '../../../enterprise/entities/project-scheduled'
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
    private readonly publicationNotifier?: PublicationNotifier,
  ) {}

  async execute({
    date = new Date(),
  }: PublishScheduledProjectsUseCaseRequest = {}): Promise<PublishScheduledProjectsUseCaseResponse> {
    const schedules = await this.projectScheduledRepository.findManyDueToPublish(date)
    const publishedProjects: Project[] = []

    for (const schedule of schedules) {
      const project = await this.publishDueSchedule(schedule)

      if (project) {
        publishedProjects.push(project)
      }
    }

    await this.logPublishedProjects(publishedProjects)

    return right({ projects: publishedProjects })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'project.scheduled',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async notifyFollowers(projectId: string) {
    try {
      await this.publicationNotifier?.execute({ projectId })
    } catch {
      return
    }
  }

  private async publishDueSchedule(schedule: ProjectScheduled): Promise<Project | null> {
    const project = await this.projectsRepository.findById(schedule.projectId.toString())

    if (!project) {
      return null
    }

    if (project.status !== ProjectStatus.SCHEDULED) {
      return null
    }

    project.status = ProjectStatus.PUBLISHED

    await this.projectsRepository.save(project)
    await this.notifyFollowers(project.id.toString())

    return project
  }

  private async logPublishedProjects(projects: Project[]) {
    for (const project of projects) {
      await this.log({
        actorId: 'internal-system',
        resourceId: project.id.toString(),
        text: `Projeto ${project.id.toString()} publicado com sucesso.`,
        status: AuditLogStatus.SUCCESS,
        diff: null,
      })
    }
  }
}
