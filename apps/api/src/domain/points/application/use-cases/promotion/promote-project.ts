import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { UserNotActiveError } from '@/domain/project/application/_errors/user-not-active-error'
import type { ProjectMembersRepository } from '@/domain/project/application/repositories/project-members-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { type Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
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

const DAY_IN_MS = 24 * 60 * 60 * 1000

interface PromoteProjectUseCaseRequest {
  projectId: string
  userId: string
  sessionId: string
}

type PromotionWithDebit = {
  promotion: Promotion
  debit: PointTransaction
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

export class PromoteProjectUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly promotionsRepository: PromotionsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    projectId,
    userId,
    sessionId,
  }: PromoteProjectUseCaseRequest): Promise<PromoteProjectUseCaseResponse> {
    const userResult = await this.validateUserActive(userId, sessionId, projectId)

    if (userResult.isLeft()) {
      return left(userResult.value)
    }

    const projectResult = await this.findProjectOrFail(projectId, userId, sessionId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    const statusResult = await this.validateProjectPublished(project, userId, sessionId)

    if (statusResult.isLeft()) {
      return left(statusResult.value)
    }

    const ownershipResult = await this.validateNotProjectOwner(project, userId, sessionId)

    if (ownershipResult.isLeft()) {
      return left(ownershipResult.value)
    }

    const { promotion, debit } = this.buildPromotionWithDebit(project, userId)

    const outcome = await this.createWithDebit(promotion, debit, userId, sessionId)

    const outcomeResult = await this.validateOutcome(outcome, projectId, userId, sessionId)

    if (outcomeResult.isLeft()) {
      return left(outcomeResult.value)
    }

    await this.logPromotionCreated(promotion, debit, userId, sessionId)

    return right({ promotion })
  }

  private async log({
    actorId,
    sessionId,
    resourceId,
    text,
    status,
    diff,
    resource = 'points.promotion',
  }: LogParams & { resource?: string }) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource,
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async validateUserActive(
    userId: string,
    sessionId: string,
    projectId: string,
  ): Promise<Either<UserNotActiveError, null>> {
    const user = await this.usersRepository.findById(userId)

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Usuário ${userId} não está ativo para promover o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotActiveError())
    }

    return right(null)
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
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    return right(project)
  }

  private async validateProjectPublished(
    project: Project,
    userId: string,
    sessionId: string,
  ): Promise<Either<ProjectNotEligibleForPromotionError, null>> {
    if (project.status !== ProjectStatus.PUBLISHED) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: project.id.toString(),
        text: `Projeto ${project.id.toString()} não está publicado (status=${project.status}).`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotEligibleForPromotionError())
    }

    return right(null)
  }

  private async validateNotProjectOwner(
    project: Project,
    userId: string,
    sessionId: string,
  ): Promise<Either<CannotPromoteOwnProjectError, null>> {
    const projectId = project.id.toString()

    const membership = await this.projectMembersRepository.findByProjectAndUser(projectId, userId)
    const isAuthor = project.author.toString() === userId
    const isCoauthor = membership?.status === ProjectMemberStatus.ACCEPTED

    if (isAuthor || isCoauthor) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Usuário ${userId} tentou promover o próprio projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotPromoteOwnProjectError())
    }

    return right(null)
  }

  private buildPromotionWithDebit(project: Project, userId: string): PromotionWithDebit {
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

    return { promotion, debit }
  }

  private async createWithDebit(
    promotion: Promotion,
    debit: PointTransaction,
    userId: string,
    sessionId: string,
  ): Promise<CreatePromotionWithDebitResult> {
    const projectId = promotion.projectId.toString()

    try {
      return await this.promotionsRepository.createWithDebit(promotion, debit)
    } catch (error) {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Falha ao registrar a promoção do projeto ${projectId} pelo usuário ${userId}.`,
        status: AuditLogStatus.FAILURE,
      })

      throw error
    }
  }

  private async validateOutcome(
    outcome: CreatePromotionWithDebitResult,
    projectId: string,
    userId: string,
    sessionId: string,
  ): Promise<Either<ProjectAlreadyPromotedByUserError | InsufficientPointsError, null>> {
    if (outcome.status === 'ALREADY_PROMOTED') {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Usuário ${userId} já tem uma promoção ativa no projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectAlreadyPromotedByUserError())
    }

    if (outcome.status === 'INSUFFICIENT_BALANCE') {
      await this.log({
        actorId: userId,
        sessionId,
        resourceId: projectId,
        text: `Usuário ${userId} sem saldo para promover o projeto ${projectId} (saldo ${outcome.balance}, custo ${PROMOTION_COST}).`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new InsufficientPointsError(PROMOTION_COST, outcome.balance))
    }

    return right(null)
  }

  private async logPromotionCreated(promotion: Promotion, debit: PointTransaction, userId: string, sessionId: string) {
    const projectId = promotion.projectId.toString()

    await this.log({
      actorId: userId,
      sessionId,
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

    await this.log({
      actorId: userId,
      sessionId,
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
  }
}
