import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { Project } from '../../../enterprise/entities/project'
import type { ProjectStar } from '../../../enterprise/entities/project-star'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { StarNotFoundError } from '../../_errors/star-not-found-error'
import type { ProjectStarsRepository } from '../../repositories/project-stars-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface UnstarProjectUseCaseRequest {
  projectId: string
  userId: string
  sessionId: string
}

type UnstarProjectUseCaseResponse = Either<ProjectNotFoundError | StarNotFoundError, null>

export class UnstarProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectStarsRepository: ProjectStarsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({ projectId, userId, sessionId }: UnstarProjectUseCaseRequest): Promise<UnstarProjectUseCaseResponse> {
    const projectResult = await this.findProjectOrFail(projectId, userId, sessionId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const starResult = await this.findActiveStarOrFail(projectId, userId, sessionId)

    if (starResult.isLeft()) {
      return left(starResult.value)
    }

    const star = starResult.value

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

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.DELETE,
      resource: 'project.project_star',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findProjectOrFail(
    projectId: string,
    userId: string,
    sessionId: string,
  ): Promise<Either<ProjectNotFoundError, Project>> {
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

    return right(project)
  }

  private async findActiveStarOrFail(
    projectId: string,
    userId: string,
    sessionId: string,
  ): Promise<Either<StarNotFoundError, ProjectStar>> {
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

    return right(star)
  }
}
