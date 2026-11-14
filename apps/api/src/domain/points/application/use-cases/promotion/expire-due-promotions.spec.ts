import { makePromotion } from '@tests/factories/make-promotion'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { InMemoryPromotionsRepository } from '@tests/repositories/in-memory-promotions-repository'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { PromotionStatus } from '../../../enterprise/entities/promotion'
import { ExpireDuePromotionsUseCase } from './expire-due-promotions'

const DAY_IN_MS = 24 * 60 * 60 * 1000

let promotionsRepository: InMemoryPromotionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: ExpireDuePromotionsUseCase

describe('(UC) - Expire Due Promotions', () => {
  beforeEach(() => {
    promotionsRepository = new InMemoryPromotionsRepository(new InMemoryPointTransactionsRepository())
    auditLogsRepository = new InMemoryAuditLogsRepository()

    sut = new ExpireDuePromotionsUseCase(promotionsRepository, new RegisterLogUseCase(auditLogsRepository))
  })

  it('should expire an active promotion whose validity has passed', async () => {
    const { promotion } = makePromotion({ expiresAt: new Date(Date.now() - 1000) })
    promotionsRepository.items.push(promotion)

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    expect(result.value.expiredPromotions).toHaveLength(1)
    expect(result.value.expiredPromotions[0].id.toString()).toBe(promotion.id.toString())
    expect(promotion.status).toBe(PromotionStatus.EXPIRED)
  })

  it('should not expire a promotion that is still valid', async () => {
    const { promotion } = makePromotion({ expiresAt: new Date(Date.now() + DAY_IN_MS) })
    promotionsRepository.items.push(promotion)

    const result = await sut.execute()

    expect(result.value.expiredPromotions).toHaveLength(0)
    expect(promotion.status).toBe(PromotionStatus.ACTIVE)
  })

  it('should ignore promotions that are already expired', async () => {
    const { promotion } = makePromotion({
      status: PromotionStatus.EXPIRED,
      expiresAt: new Date(Date.now() - 1000),
    })
    promotionsRepository.items.push(promotion)

    const result = await sut.execute()

    expect(result.value.expiredPromotions).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(0)
  })

  it('should expire every due promotion in a single run', async () => {
    const due = [
      makePromotion({ expiresAt: new Date(Date.now() - 2000) }).promotion,
      makePromotion({ expiresAt: new Date(Date.now() - 1000) }).promotion,
    ]
    const valid = makePromotion({ expiresAt: new Date(Date.now() + DAY_IN_MS) }).promotion

    promotionsRepository.items.push(...due, valid)

    const result = await sut.execute()

    expect(result.value.expiredPromotions).toHaveLength(2)
    expect(due.every((promotion) => promotion.status === PromotionStatus.EXPIRED)).toBe(true)
    expect(valid.status).toBe(PromotionStatus.ACTIVE)
  })

  it('should not expire the same promotion twice', async () => {
    promotionsRepository.items.push(makePromotion({ expiresAt: new Date(Date.now() - 1000) }).promotion)

    const first = await sut.execute()
    const second = await sut.execute()

    expect(first.value.expiredPromotions).toHaveLength(1)
    expect(second.value.expiredPromotions).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(1)
  })

  it('should use the informed date to decide which promotions are due', async () => {
    const { promotion } = makePromotion({ expiresAt: new Date(Date.now() + 3 * DAY_IN_MS) })
    promotionsRepository.items.push(promotion)

    const result = await sut.execute({ now: new Date(Date.now() + 5 * DAY_IN_MS) })

    expect(result.value.expiredPromotions).toHaveLength(1)
    expect(promotion.status).toBe(PromotionStatus.EXPIRED)
  })

  it('should register a success audit log for each expired promotion', async () => {
    promotionsRepository.items.push(
      makePromotion({ expiresAt: new Date(Date.now() - 2000) }).promotion,
      makePromotion({ expiresAt: new Date(Date.now() - 1000) }).promotion,
    )

    await sut.execute()

    expect(auditLogsRepository.items).toHaveLength(2)
    expect(auditLogsRepository.items.every((log) => log.status === AuditLogStatus.SUCCESS)).toBe(true)
    expect(auditLogsRepository.items.every((log) => log.action === AuditLogAction.UPDATE)).toBe(true)
    expect(auditLogsRepository.items.every((log) => log.resource === 'points.promotion')).toBe(true)
  })

  it('should skip a promotion that another run has already expired', async () => {
    const { promotion } = makePromotion({ expiresAt: new Date(Date.now() - 1000) })
    promotionsRepository.items.push(promotion)

    vi.spyOn(promotionsRepository, 'tryExpire').mockResolvedValueOnce(false)

    const result = await sut.execute()

    expect(result.value.expiredPromotions).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(0)
  })
})
