import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectStar } from '../../../enterprise/entities/project-star'
import { CannotRateOwnProjectError } from '../../_errors/cannot-rate-own-project-error'
import { ProjectNotEligibleForRatingError } from '../../_errors/project-not-eligible-for-rating-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { UserNotActiveError } from '../../_errors/user-not-active-error'
import { resolveStarWeight } from '../../helpers/resolve-star-weight'
import type { ProjectStarsRepository } from '../../repositories/project-stars-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface StarProjectUseCaseRequest {
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

type StarProjectUseCaseResponse = Either<
  ProjectNotFoundError | ProjectNotEligibleForRatingError | CannotRateOwnProjectError | UserNotActiveError,
  { projectStar: ProjectStar }
>

export class StarProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectStarsRepository: ProjectStarsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'project.project_star',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({ projectId, userId, sessionId }: StarProjectUseCaseRequest): Promise<StarProjectUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Usuário ${userId} não está ativo para estrelar o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotActiveError())
    }

    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    if (project.status !== ProjectStatus.PUBLISHED) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Projeto ${projectId} não está publicado (status=${project.status}).`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotEligibleForRatingError())
    }

    if (project.author.toString() === userId) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Usuário ${userId} tentou estrelar o próprio projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotRateOwnProjectError())
    }

    const weight = await resolveStarWeight(this.institutionMembersRepository, userId)
    const existingStar = await this.projectStarsRepository.findByProjectAndUser(projectId, userId)

    if (existingStar) {
      if (existingStar.active) {
        return right({ projectStar: existingStar })
      }

      const previousWeight = existingStar.weight
      existingStar.reactivate(weight)
      await this.projectStarsRepository.save(existingStar)

      await this.log({
        actorId: userId,
        sessionId,
        resourceId: existingStar.id.toString(),
        text: `Estrela reativada no projeto ${projectId} pelo usuário ${userId}.`,
        status: AuditLogStatus.SUCCESS,
        diff: {
          active: { old: false, new: true },
          weight: { old: previousWeight, new: weight },
          projectId: { old: null, new: projectId },
          userId: { old: null, new: userId },
        },
      })

      return right({ projectStar: existingStar })
    }

    const projectStar = ProjectStar.create({
      projectId: new UniqueEntityId(projectId),
      userId: new UniqueEntityId(userId),
      weight,
    })

    await this.projectStarsRepository.create(projectStar)

    await this.log({
      actorId: userId,
      sessionId,
      resourceId: projectStar.id.toString(),
      text: `Estrela criada no projeto ${projectId} pelo usuário ${userId} (peso ${weight}).`,
      status: AuditLogStatus.SUCCESS,
      diff: {
        projectId: { old: null, new: projectId },
        userId: { old: null, new: userId },
        weight: { old: null, new: weight },
        active: { old: null, new: true },
      },
    })

    return right({ projectStar })
  }
}
