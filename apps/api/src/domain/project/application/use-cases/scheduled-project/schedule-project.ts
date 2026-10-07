import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectScheduled } from '../../../enterprise/entities/project-scheduled'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectAlreadyScheduledError } from '../../_errors/project-already-scheduled-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectScheduledRepository } from '../../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface ScheduleProjectUseCaseRequest {
  projectId: string
  authorId: string
  publishedIn: Date
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type ScheduleProjectUseCaseResponse = Either<
  ProjectNotFoundError | NotProjectOwnerError | ProjectAlreadyScheduledError | InvalidProjectStatusError,
  { projectScheduled: ProjectScheduled }
>

export class ScheduleProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.CREATE,
      resource: 'project.scheduled',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    projectId,
    authorId,
    publishedIn,
  }: ScheduleProjectUseCaseRequest): Promise<ScheduleProjectUseCaseResponse> {
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

    if (project.status !== ProjectStatus.SKETCH) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} não está em rascunho.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InvalidProjectStatusError('Somente projetos em rascunho podem ser agendados'))
    }

    const projectAlreadyScheduled = await this.projectScheduledRepository.findById(projectId)

    if (projectAlreadyScheduled) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} já está agendado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectAlreadyScheduledError())
    }

    const projectScheduled = ProjectScheduled.create({
      projectId: new UniqueEntityId(projectId),
      publishedIn,
    })

    project.status = ProjectStatus.SCHEDULED

    await this.projectScheduledRepository.create(projectScheduled)
    await this.projectsRepository.save(project)

    await this.log({
      actorId: authorId,
      resourceId: projectScheduled.id.toString(),
      text: `Projeto ${projectId} agendado com sucesso com data de publicação ${publishedIn.toISOString()}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ projectScheduled })
  }
}
