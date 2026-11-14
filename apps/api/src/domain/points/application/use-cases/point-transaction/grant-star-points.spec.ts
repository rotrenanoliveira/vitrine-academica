import { makeProjectMember } from '@tests/factories/make-project-member'
import { makeProjectStar } from '@tests/factories/make-project-star'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectStarCreditsRepository } from '@tests/repositories/in-memory-project-star-credits-repository'
import { InMemoryProjectStarsRepository } from '@tests/repositories/in-memory-project-stars-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { PointTransactionReason, PointTransactionType } from '../../../enterprise/entities/point-transaction'
import { GrantStarPointsUseCase } from './grant-star-points'

let projectMembersRepository: InMemoryProjectMembersRepository
let projectStarsRepository: InMemoryProjectStarsRepository
let pointTransactionsRepository: InMemoryPointTransactionsRepository
let projectStarCreditsRepository: InMemoryProjectStarCreditsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: GrantStarPointsUseCase

describe('(UC) - Grant Star Points', () => {
  beforeEach(() => {
    projectMembersRepository = new InMemoryProjectMembersRepository()
    projectStarsRepository = new InMemoryProjectStarsRepository()
    pointTransactionsRepository = new InMemoryPointTransactionsRepository()
    projectStarCreditsRepository = new InMemoryProjectStarCreditsRepository(
      projectStarsRepository,
      pointTransactionsRepository,
    )
    auditLogsRepository = new InMemoryAuditLogsRepository()

    sut = new GrantStarPointsUseCase(
      projectMembersRepository,
      projectStarCreditsRepository,
      new RegisterLogUseCase(auditLogsRepository),
    )
  })

  it('should save the star and credit the author with the star weight', async () => {
    const authorId = new UniqueEntityId()
    const { projectStar } = makeProjectStar({ weight: 1 })

    const result = await sut.execute({
      projectStar,
      authorId: authorId.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectStarsRepository.items).toHaveLength(1)
    expect(pointTransactionsRepository.items).toHaveLength(1)
    expect(pointTransactionsRepository.items[0].type).toBe(PointTransactionType.CREDIT)
    expect(pointTransactionsRepository.items[0].reason).toBe(PointTransactionReason.STAR_RECEIVED)
    expect(pointTransactionsRepository.items[0].referenceId.toString()).toBe(projectStar.id.toString())
    expect(await pointTransactionsRepository.getBalanceByUserId(authorId.toString())).toBe(1)
  })

  it('should credit 5 points when the star has weight 5', async () => {
    const authorId = new UniqueEntityId()
    const { projectStar } = makeProjectStar({ weight: 5 })

    await sut.execute({
      projectStar,
      authorId: authorId.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(await pointTransactionsRepository.getBalanceByUserId(authorId.toString())).toBe(5)
  })

  it('should credit the author and only the accepted members with the full value', async () => {
    const authorId = new UniqueEntityId()
    const projectId = new UniqueEntityId()
    const accepted = new UniqueEntityId()
    const pending = new UniqueEntityId()
    const rejected = new UniqueEntityId()

    projectMembersRepository.items.push(
      makeProjectMember({ projectId, userId: accepted, status: ProjectMemberStatus.ACCEPTED }).projectMember,
      makeProjectMember({ projectId, userId: pending, status: ProjectMemberStatus.PENDING }).projectMember,
      makeProjectMember({ projectId, userId: rejected, status: ProjectMemberStatus.REJECTED }).projectMember,
    )

    const { projectStar } = makeProjectStar({ projectId, weight: 5 })

    await sut.execute({
      projectStar,
      authorId: authorId.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(pointTransactionsRepository.items).toHaveLength(2)
    expect(await pointTransactionsRepository.getBalanceByUserId(authorId.toString())).toBe(5)
    expect(await pointTransactionsRepository.getBalanceByUserId(accepted.toString())).toBe(5)
    expect(await pointTransactionsRepository.getBalanceByUserId(pending.toString())).toBe(0)
    expect(await pointTransactionsRepository.getBalanceByUserId(rejected.toString())).toBe(0)
  })

  it('should not credit the user who gave the star, even if they are an accepted member', async () => {
    const authorId = new UniqueEntityId()
    const projectId = new UniqueEntityId()
    const starrerId = new UniqueEntityId()

    projectMembersRepository.items.push(
      makeProjectMember({ projectId, userId: starrerId, status: ProjectMemberStatus.ACCEPTED }).projectMember,
    )

    const { projectStar } = makeProjectStar({ projectId, userId: starrerId, weight: 1 })

    await sut.execute({
      projectStar,
      authorId: authorId.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(await pointTransactionsRepository.getBalanceByUserId(starrerId.toString())).toBe(0)
    expect(await pointTransactionsRepository.getBalanceByUserId(authorId.toString())).toBe(1)
  })

  it('should register a success audit log for each credit', async () => {
    const projectId = new UniqueEntityId()

    projectMembersRepository.items.push(
      makeProjectMember({ projectId, status: ProjectMemberStatus.ACCEPTED }).projectMember,
    )

    const { projectStar } = makeProjectStar({ projectId })

    await sut.execute({
      projectStar,
      authorId: new UniqueEntityId().toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(auditLogsRepository.items).toHaveLength(2)
    expect(auditLogsRepository.items.every((log) => log.status === AuditLogStatus.SUCCESS)).toBe(true)
    expect(auditLogsRepository.items.every((log) => log.resource === 'points.point_transaction')).toBe(true)
  })

  it('should register a failure audit log and rethrow when saving fails', async () => {
    const { projectStar } = makeProjectStar()

    vi.spyOn(projectStarCreditsRepository, 'createStarWithCredits').mockRejectedValueOnce(new Error('falha'))

    await expect(
      sut.execute({
        projectStar,
        authorId: new UniqueEntityId().toString(),
        sessionId: new UniqueEntityId().toString(),
      }),
    ).rejects.toThrow('falha')

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    expect(pointTransactionsRepository.items).toHaveLength(0)
  })
})
