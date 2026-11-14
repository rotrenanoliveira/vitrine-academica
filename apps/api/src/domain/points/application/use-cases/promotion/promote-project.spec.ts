import { makePointTransaction } from '@tests/factories/make-point-transaction'
import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryPromotionsRepository } from '@tests/repositories/in-memory-promotions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { UserNotActiveError } from '@/domain/project/application/_errors/user-not-active-error'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { PointTransactionReason, PointTransactionType } from '../../../enterprise/entities/point-transaction'
import { PromotionStatus } from '../../../enterprise/entities/promotion'
import { CannotPromoteOwnProjectError } from '../../_errors/cannot-promote-own-project-error'
import { InsufficientPointsError } from '../../_errors/insufficient-points-error'
import { ProjectAlreadyPromotedByUserError } from '../../_errors/project-already-promoted-by-user-error'
import { ProjectNotEligibleForPromotionError } from '../../_errors/project-not-eligible-for-promotion-error'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '../../constants/promotion-rules'
import { PromoteProjectUseCase } from './promote-project'

const DAY_IN_MS = 24 * 60 * 60 * 1000

let usersRepository: InMemoryUsersRepository
let projectsRepository: InMemoryProjectsRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let pointTransactionsRepository: InMemoryPointTransactionsRepository
let promotionsRepository: InMemoryPromotionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: PromoteProjectUseCase

function makePromoter(balance: number = PROMOTION_COST) {
  const { user } = makeUser({ status: UserStatus.ACTIVE })
  usersRepository.items.push(user)

  if (balance > 0) {
    pointTransactionsRepository.items.push(makePointTransaction({ userId: user.id, amount: balance }).pointTransaction)
  }

  return { user }
}

function makePublishedProject() {
  const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
  projectsRepository.items.push(project)

  return { project }
}

function requestOf(userId: UniqueEntityId, projectId: UniqueEntityId) {
  return {
    projectId: projectId.toString(),
    userId: userId.toString(),
    sessionId: new UniqueEntityId().toString(),
  }
}

describe('(UC) - Promote Project', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    projectsRepository = new InMemoryProjectsRepository()
    projectMembersRepository = new InMemoryProjectMembersRepository()
    pointTransactionsRepository = new InMemoryPointTransactionsRepository()
    promotionsRepository = new InMemoryPromotionsRepository(pointTransactionsRepository)
    auditLogsRepository = new InMemoryAuditLogsRepository()

    sut = new PromoteProjectUseCase(
      usersRepository,
      projectsRepository,
      projectMembersRepository,
      promotionsRepository,
      new RegisterLogUseCase(auditLogsRepository),
    )
  })

  it('should promote a published project of another author', async () => {
    const { user } = makePromoter()
    const { project } = makePublishedProject()

    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      const { promotion } = result.value

      expect(promotion.status).toBe(PromotionStatus.ACTIVE)
      expect(promotion.cost).toBe(PROMOTION_COST)
      expect(promotion.projectId.toString()).toBe(project.id.toString())
      expect(promotion.promoterId.toString()).toBe(user.id.toString())
      expect(promotion.expiresAt.getTime() - promotion.createdAt.getTime()).toBe(PROMOTION_DURATION_DAYS * DAY_IN_MS)
    }

    expect(promotionsRepository.items).toHaveLength(1)
  })

  it('should debit the cost of the promotion from the balance', async () => {
    const { user } = makePromoter(PROMOTION_COST + 250)
    const { project } = makePublishedProject()

    await sut.execute(requestOf(user.id, project.id))

    const debit = pointTransactionsRepository.items.find((item) => item.type === PointTransactionType.DEBIT)

    expect(debit?.amount).toBe(PROMOTION_COST)
    expect(debit?.reason).toBe(PointTransactionReason.PROMOTION)
    expect(debit?.referenceId.toString()).toBe(promotionsRepository.items[0].id.toString())
    expect(await pointTransactionsRepository.getBalanceByUserId(user.id.toString())).toBe(250)
  })

  it('should not promote when the user is not active', async () => {
    const { user } = makeUser({ status: UserStatus.BLOCKED })
    usersRepository.items.push(user)
    const { project } = makePublishedProject()

    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(UserNotActiveError)
    expect(promotionsRepository.items).toHaveLength(0)
  })

  it('should not promote a project that does not exist', async () => {
    const { user } = makePromoter()

    const result = await sut.execute(requestOf(user.id, new UniqueEntityId()))

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    expect(promotionsRepository.items).toHaveLength(0)
  })

  it('should not promote a project that is not published', async () => {
    const { user } = makePromoter()
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(ProjectNotEligibleForPromotionError)
    expect(promotionsRepository.items).toHaveLength(0)
  })

  it('should not allow the author to promote the own project', async () => {
    const { user } = makePromoter()
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED, author: user.id })
    projectsRepository.items.push(project)

    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(CannotPromoteOwnProjectError)
    expect(promotionsRepository.items).toHaveLength(0)
    expect(await pointTransactionsRepository.getBalanceByUserId(user.id.toString())).toBe(PROMOTION_COST)
  })

  it('should not allow an accepted co-author to promote the project', async () => {
    const { user } = makePromoter()
    const { project } = makePublishedProject()

    projectMembersRepository.items.push(
      makeProjectMember({ projectId: project.id, userId: user.id, status: ProjectMemberStatus.ACCEPTED }).projectMember,
    )

    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(CannotPromoteOwnProjectError)
    expect(promotionsRepository.items).toHaveLength(0)
  })

  it('should not promote when the balance is lower than the cost', async () => {
    const { user } = makePromoter(PROMOTION_COST - 1)
    const { project } = makePublishedProject()

    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(InsufficientPointsError)
    expect(promotionsRepository.items).toHaveLength(0)
    expect(await pointTransactionsRepository.getBalanceByUserId(user.id.toString())).toBe(PROMOTION_COST - 1)
  })

  it('should leave the balance at zero when it was exactly the cost', async () => {
    const { user } = makePromoter(PROMOTION_COST)
    const { project } = makePublishedProject()

    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isRight()).toBeTruthy()
    expect(await pointTransactionsRepository.getBalanceByUserId(user.id.toString())).toBe(0)
  })

  it('should not allow two active promotions of the same user on the same project', async () => {
    const { user } = makePromoter(PROMOTION_COST * 2)
    const { project } = makePublishedProject()

    await sut.execute(requestOf(user.id, project.id))
    const result = await sut.execute(requestOf(user.id, project.id))

    expect(result.isLeft()).toBeTruthy()
    expect(result.value).toBeInstanceOf(ProjectAlreadyPromotedByUserError)
    expect(promotionsRepository.items).toHaveLength(1)
    expect(await pointTransactionsRepository.getBalanceByUserId(user.id.toString())).toBe(PROMOTION_COST)
  })

  it('should allow different users to promote the same project', async () => {
    const { user: first } = makePromoter()
    const { user: second } = makePromoter()
    const { project } = makePublishedProject()

    const firstResult = await sut.execute(requestOf(first.id, project.id))
    const secondResult = await sut.execute(requestOf(second.id, project.id))

    expect(firstResult.isRight()).toBeTruthy()
    expect(secondResult.isRight()).toBeTruthy()
    expect(promotionsRepository.items).toHaveLength(2)
  })

  it('should register a success audit log for the promotion and for the debit', async () => {
    const { user } = makePromoter()
    const { project } = makePublishedProject()

    await sut.execute(requestOf(user.id, project.id))

    expect(auditLogsRepository.items).toHaveLength(2)
    expect(auditLogsRepository.items.every((log) => log.status === AuditLogStatus.SUCCESS)).toBe(true)
    expect(auditLogsRepository.items.map((log) => log.resource)).toEqual([
      'points.promotion',
      'points.point_transaction',
    ])
  })

  it('should register a failure audit log when the balance is insufficient', async () => {
    const { user } = makePromoter(0)
    const { project } = makePublishedProject()

    await sut.execute(requestOf(user.id, project.id))

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    expect(auditLogsRepository.items[0].resource).toBe('points.promotion')
  })

  it('should register a failure audit log and rethrow when saving fails', async () => {
    const { user } = makePromoter()
    const { project } = makePublishedProject()

    vi.spyOn(promotionsRepository, 'createWithDebit').mockRejectedValueOnce(new Error('falha'))

    await expect(sut.execute(requestOf(user.id, project.id))).rejects.toThrow('falha')

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    expect(pointTransactionsRepository.items.some((item) => item.type === PointTransactionType.DEBIT)).toBe(false)
  })
})
