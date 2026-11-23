import { type Either, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { ProjectMembersRepository } from '@/domain/project/application/repositories/project-members-repository'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import type { ProjectStar } from '@/domain/project/enterprise/entities/project-star'
import {
  PointTransaction,
  PointTransactionReason,
  PointTransactionType,
} from '../../../enterprise/entities/point-transaction'
import type { ProjectStarCreditsRepository } from '../../repositories/project-star-credits-repository'

interface GrantStarPointsUseCaseRequest {
  projectStar: ProjectStar
  authorId: string
  sessionId: string
}

type GrantStarPointsUseCaseResponse = Either<never, { transactions: PointTransaction[] }>

export class GrantStarPointsUseCase {
  constructor(
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly projectStarCreditsRepository: ProjectStarCreditsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    projectStar,
    authorId,
    sessionId,
  }: GrantStarPointsUseCaseRequest): Promise<GrantStarPointsUseCaseResponse> {
    const beneficiaryIds = await this.findBeneficiaryIds(projectStar, authorId)

    const transactions = this.buildCreditTransactions(projectStar, beneficiaryIds)

    await this.saveStarWithCredits(projectStar, transactions, sessionId)

    await this.logCredits(projectStar, transactions, sessionId)

    return right({ transactions })
  }

  private async log({ actorId, sessionId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'points.point_transaction',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findBeneficiaryIds(projectStar: ProjectStar, authorId: string): Promise<string[]> {
    const projectId = projectStar.projectId.toString()
    const starrerId = projectStar.userId.toString()

    const members = await this.projectMembersRepository.findManyByProjectId(projectId)

    const beneficiaryIds = new Set<string>([authorId])

    for (const member of members) {
      if (member.status === ProjectMemberStatus.ACCEPTED) {
        beneficiaryIds.add(member.userId.toString())
      }
    }

    beneficiaryIds.delete(starrerId)

    return [...beneficiaryIds]
  }

  private buildCreditTransactions(projectStar: ProjectStar, beneficiaryIds: string[]): PointTransaction[] {
    return beneficiaryIds.map((beneficiaryId) =>
      PointTransaction.create({
        userId: new UniqueEntityId(beneficiaryId),
        type: PointTransactionType.CREDIT,
        amount: projectStar.weight,
        reason: PointTransactionReason.STAR_RECEIVED,
        referenceId: projectStar.id,
      }),
    )
  }

  private async saveStarWithCredits(projectStar: ProjectStar, transactions: PointTransaction[], sessionId: string) {
    try {
      await this.projectStarCreditsRepository.createStarWithCredits(projectStar, transactions)
    } catch (error) {
      await this.log({
        actorId: projectStar.userId.toString(),
        sessionId,
        resourceId: projectStar.id.toString(),
        text: `Falha ao registrar a estrela ${projectStar.id.toString()} e os pontos dos beneficiários do projeto ${projectStar.projectId.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      throw error
    }
  }

  private async logCredits(projectStar: ProjectStar, transactions: PointTransaction[], sessionId: string) {
    for (const transaction of transactions) {
      await this.log({
        actorId: projectStar.userId.toString(),
        sessionId,
        resourceId: transaction.id.toString(),
        diff: {
          userId: { old: null, new: transaction.userId.toString() },
          type: { old: null, new: transaction.type },
          amount: { old: null, new: transaction.amount },
          reason: { old: null, new: transaction.reason },
          referenceId: { old: null, new: transaction.referenceId.toString() },
        },
        text: `Crédito de ${transaction.amount} ponto(s) para o usuário ${transaction.userId.toString()} pela estrela ${projectStar.id.toString()}.`,
        status: AuditLogStatus.SUCCESS,
      })
    }
  }
}
