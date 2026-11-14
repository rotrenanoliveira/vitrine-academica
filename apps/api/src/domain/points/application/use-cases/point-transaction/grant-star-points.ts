import { type Either, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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

    const transactions = [...beneficiaryIds].map((beneficiaryId) =>
      PointTransaction.create({
        userId: new UniqueEntityId(beneficiaryId),
        type: PointTransactionType.CREDIT,
        amount: projectStar.weight,
        reason: PointTransactionReason.STAR_RECEIVED,
        referenceId: projectStar.id,
      }),
    )

    try {
      await this.projectStarCreditsRepository.createStarWithCredits(projectStar, transactions)
    } catch (error) {
      await this.registerLog.execute({
        actorId: starrerId,
        sessionId,
        action: AuditLogAction.CREATE,
        resource: 'points.point_transaction',
        resourceId: projectStar.id.toString(),
        diff: null,
        text: `Falha ao registrar a estrela ${projectStar.id.toString()} e os pontos dos beneficiários do projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      throw error
    }

    for (const transaction of transactions) {
      await this.registerLog.execute({
        actorId: starrerId,
        sessionId,
        action: AuditLogAction.CREATE,
        resource: 'points.point_transaction',
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

    return right({ transactions })
  }
}
