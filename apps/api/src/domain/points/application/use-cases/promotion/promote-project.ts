import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { UserNotActiveError } from '@/domain/project/application/_errors/user-not-active-error'
import type { ProjectMembersRepository } from '@/domain/project/application/repositories/project-members-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import {
  PointTransaction,
  PointTransactionReason,
  PointTransactionType,
} from '../../../enterprise/entities/point-transaction'
import { Promotion } from '../../../enterprise/entities/promotion'
import { CannotPromoteOwnProjectError } from '../../_errors/cannot-promote-own-project-error'
import { InsufficientPointsError } from '../../_errors/insufficient-points-error'
import { ProjectAlreadyPromotedByUserError } from '../../_errors/project-already-promoted-by-user-error'
import { ProjectNotEligibleForPromotionError } from '../../_errors/project-not-eligible-for-promotion-error'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '../../constants/promotion-rules'
import type { CreatePromotionWithDebitResult, PromotionsRepository } from '../../repositories/promotions-repository'

interface PromoteProjectUseCaseRequest {
  projectId: string
  userId: string
  sessionId: string
}

type FailureLogParams = {
  userId: string
  sessionId: string
  projectId: string
  text: string
}

type PromoteProjectUseCaseResponse = Either<
  | ProjectNotFoundError
  | UserNotActiveError
  | ProjectNotEligibleForPromotionError
  | CannotPromoteOwnProjectError
  | InsufficientPointsError
  | ProjectAlreadyPromotedByUserError,
  { promotion: Promotion }
>

const DAY_IN_MS = 24 * 60 * 60 * 1000

export class PromoteProjectUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly promotionsRepository: PromotionsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async logFailure({ userId, sessionId, projectId, text }: FailureLogParams) {
    await this.registerLog.execute({
      actorId: userId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'points.promotion',
      resourceId: projectId,
      diff: null,
      status: AuditLogStatus.FAILURE,
      text,
    })
  }

  async execute({
    projectId,
    userId,
    sessionId,
  }: PromoteProjectUseCaseRequest): Promise<PromoteProjectUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.logFailure({
        userId,
        sessionId,
        projectId,
        text: `Usuário ${userId} não está ativo para promover o projeto ${projectId}.`,
      })

      return left(new UserNotActiveError())
    }

    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.logFailure({ userId, sessionId, projectId, text: `Projeto ${projectId} não encontrado.` })

      return left(new ProjectNotFoundError())
    }

    if (project.status !== ProjectStatus.PUBLISHED) {
      await this.logFailure({
        userId,
        sessionId,
        projectId,
        text: `Projeto ${projectId} não está publicado (status=${project.status}).`,
      })

      return left(new ProjectNotEligibleForPromotionError())
    }

    const membership = await this.projectMembersRepository.findByProjectAndUser(projectId, userId)
    const isAuthor = project.author.toString() === userId
    const isCoauthor = membership?.status === ProjectMemberStatus.ACCEPTED

    if (isAuthor || isCoauthor) {
      await this.logFailure({
        userId,
        sessionId,
        projectId,
        text: `Usuário ${userId} tentou promover o próprio projeto ${projectId}.`,
      })

      return left(new CannotPromoteOwnProjectError())
    }

    const createdAt = new Date()

    const promotion = Promotion.create({
      projectId: project.id,
      promoterId: new UniqueEntityId(userId),
      cost: PROMOTION_COST,
      expiresAt: new Date(createdAt.getTime() + PROMOTION_DURATION_DAYS * DAY_IN_MS),
      createdAt,
    })

    const debit = PointTransaction.create({
      userId: promotion.promoterId,
      type: PointTransactionType.DEBIT,
      amount: PROMOTION_COST,
      reason: PointTransactionReason.PROMOTION,
      referenceId: promotion.id,
      createdAt,
    })

    let outcome: CreatePromotionWithDebitResult

    try {
      outcome = await this.promotionsRepository.createWithDebit(promotion, debit)
    } catch (error) {
      await this.logFailure({
        userId,
        sessionId,
        projectId,
        text: `Falha ao registrar a promoção do projeto ${projectId} pelo usuário ${userId}.`,
      })

      throw error
    }

    if (outcome.status === 'ALREADY_PROMOTED') {
      await this.logFailure({
        userId,
        sessionId,
        projectId,
        text: `Usuário ${userId} já tem uma promoção ativa no projeto ${projectId}.`,
      })

      return left(new ProjectAlreadyPromotedByUserError())
    }

    if (outcome.status === 'INSUFFICIENT_BALANCE') {
      await this.logFailure({
        userId,
        sessionId,
        projectId,
        text: `Usuário ${userId} sem saldo para promover o projeto ${projectId} (saldo ${outcome.balance}, custo ${PROMOTION_COST}).`,
      })

      return left(new InsufficientPointsError(PROMOTION_COST, outcome.balance))
    }

    await this.registerLog.execute({
      actorId: userId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'points.promotion',
      resourceId: promotion.id.toString(),
      diff: {
        projectId: { old: null, new: projectId },
        promoterId: { old: null, new: userId },
        cost: { old: null, new: promotion.cost },
        status: { old: null, new: promotion.status },
        expiresAt: { old: null, new: promotion.expiresAt.toISOString() },
      },
      status: AuditLogStatus.SUCCESS,
      text: `Projeto ${projectId} promovido pelo usuário ${userId} até ${promotion.expiresAt.toISOString()}.`,
    })

    await this.registerLog.execute({
      actorId: userId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'points.point_transaction',
      resourceId: debit.id.toString(),
      diff: {
        userId: { old: null, new: userId },
        type: { old: null, new: debit.type },
        amount: { old: null, new: debit.amount },
        reason: { old: null, new: debit.reason },
        referenceId: { old: null, new: promotion.id.toString() },
      },
      status: AuditLogStatus.SUCCESS,
      text: `Débito de ${debit.amount} ponto(s) do usuário ${userId} pela promoção ${promotion.id.toString()}.`,
    })

    return right({ promotion })
  }
}
