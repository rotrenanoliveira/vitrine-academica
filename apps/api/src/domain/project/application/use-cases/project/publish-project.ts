import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
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
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'project',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    projectId,
    authorId,
    date = new Date(),
  }: PublishProjectUseCaseRequest): Promise<PublishProjectUseCaseResponse> {
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

    if (project.author.toString() !== authorId) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Usuário ${authorId} não é dono do projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    if (!PUBLISHABLE_STATUSES.includes(project.status)) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} não pode ser publicado com o status ${project.status}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidProjectStatusError('Somente projetos em rascunho ou agendados podem ser publicados'))
    }

    const previousStatus = project.status

    project.status = ProjectStatus.PUBLISHED
    await this.projectsRepository.save(project)

    const projectScheduled = await this.projectScheduledRepository.findById(projectId)

    if (projectScheduled) {
      projectScheduled.publishedIn = date
      await this.projectScheduledRepository.save(projectScheduled)
    } else {
      await this.projectScheduledRepository.create(
        ProjectScheduled.create({ projectId: project.id, publishedIn: date }),
      )
    }

    await this.log({
      actorId: authorId,
      resourceId: projectId,
      text: `Projeto ${projectId} publicado manualmente com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { status: { old: previousStatus, new: ProjectStatus.PUBLISHED } },
    })

    return right({ project })
  }
}
