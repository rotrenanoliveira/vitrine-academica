import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { PublicationNotifier } from '@/domain/project/application/notifier/publication-notifier'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectScheduled } from '../../../enterprise/entities/project-scheduled'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectScheduledRepository } from '../../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

const PUBLISHABLE_STATUSES = [ProjectStatus.SKETCH, ProjectStatus.SCHEDULED]

interface PublishProjectUseCaseRequest {
  projectId: string
  authorId: string
  date?: Date
}

type PublishProjectUseCaseResponse = Either<
  ProjectNotFoundError | NotProjectOwnerError | InvalidProjectStatusError,
  { project: Project }
>

export class PublishProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
    private readonly registerLog: RegisterLogUseCase,
    private readonly publicationNotifier?: PublicationNotifier,
  ) {}

  async execute({
    projectId,
    authorId,
    date = new Date(),
  }: PublishProjectUseCaseRequest): Promise<PublishProjectUseCaseResponse> {
    const projectResult = await this.findProjectOrFail(projectId, authorId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    const ownerResult = await this.isProjectOwner(project, authorId)

    if (ownerResult.isLeft()) {
      return left(ownerResult.value)
    }

    const publishableResult = await this.isPublishable(project, authorId)

    if (publishableResult.isLeft()) {
      return left(publishableResult.value)
    }

    const previousStatus = project.status

    project.status = ProjectStatus.PUBLISHED
    await this.projectsRepository.save(project)

    await this.upsertPublishedSchedule(project, date)

    await this.log({
      actorId: authorId,
      resourceId: projectId,
      text: `Projeto ${projectId} publicado manualmente com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: previousStatus, new: ProjectStatus.PUBLISHED } },
    })

    await this.notifyFollowers(project.id.toString())

    return right({ project })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'project',
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

  private async findProjectOrFail(projectId: string, authorId: string): Promise<Either<ProjectNotFoundError, Project>> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    return right(project)
  }

  private async isProjectOwner(project: Project, authorId: string): Promise<Either<NotProjectOwnerError, null>> {
    if (project.author.toString() !== authorId) {
      await this.log({
        actorId: authorId,
        resourceId: project.id.toString(),
        text: `Usuário ${authorId} não é dono do projeto ${project.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    return right(null)
  }

  private async isPublishable(project: Project, authorId: string): Promise<Either<InvalidProjectStatusError, null>> {
    if (!PUBLISHABLE_STATUSES.includes(project.status)) {
      await this.log({
        actorId: authorId,
        resourceId: project.id.toString(),
        text: `Projeto ${project.id.toString()} não pode ser publicado com o status ${project.status}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidProjectStatusError('Somente projetos em rascunho ou agendados podem ser publicados'))
    }

    return right(null)
  }

  private async upsertPublishedSchedule(project: Project, date: Date) {
    const projectScheduled = await this.projectScheduledRepository.findById(project.id.toString())

    if (projectScheduled) {
      projectScheduled.publishedIn = date
      await this.projectScheduledRepository.save(projectScheduled)
      return
    }

    await this.projectScheduledRepository.create(ProjectScheduled.create({ projectId: project.id, publishedIn: date }))
  }
}
