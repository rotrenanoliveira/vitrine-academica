import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { StarNotFoundError } from '../../_errors/star-not-found-error'
import type { ProjectStarsRepository } from '../../repositories/project-stars-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface UnstarProjectUseCaseRequest {
  projectId: string
  userId: string
  sessionId: string
}

type LogParams = {
  actorId: string
  sessionId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type UnstarProjectUseCaseResponse = Either<ProjectNotFoundError | StarNotFoundError, null>

export class UnstarProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectStarsRepository: ProjectStarsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId,
      action: AuditLogAction.DELETE,
      resource: 'project.project_star',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({ projectId, userId, sessionId }: UnstarProjectUseCaseRequest): Promise<UnstarProjectUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Projeto ${projectId} não encontrado ao remover estrela.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    const star = await this.projectStarsRepository.findActiveByProjectAndUser(projectId, userId)

    if (!star) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Estrela ativa não encontrada para o usuário ${userId} no projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new StarNotFoundError())
    }

    star.deactivate()
    await this.projectStarsRepository.save(star)

    await this.log({
      actorId: userId,
      sessionId,
      resourceId: star.id.toString(),
      text: `Estrela removida do projeto ${projectId} pelo usuário ${userId}.`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        active: { old: true, new: false },
        projectId: { old: projectId, new: projectId },
        userId: { old: userId, new: userId },
      },
    })

    return right(null)
  }
}
