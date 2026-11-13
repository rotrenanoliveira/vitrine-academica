import { makeAuthorSubscription } from '@tests/factories/make-author-subscription'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryAuthorSubscriptionsRepository } from '@tests/repositories/in-memory-author-subscriptions-repository'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { SubscriptionNotFoundError } from '@/domain/newsletter/application/_errors/subscription-not-found-error'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { UnsubscribeByTokenUseCase } from './unsubscribe-by-token'

let subscriptionsRepository: InMemoryAuthorSubscriptionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: UnsubscribeByTokenUseCase

describe('(UC) - Unsubscribe By Token', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryAuthorSubscriptionsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new UnsubscribeByTokenUseCase(subscriptionsRepository, registerLog)
  })

  it('deve cancelar a assinatura a partir do token, registrando a data do cancelamento', async () => {
    const { subscription } = makeAuthorSubscription()
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({ token: subscription.unsubscribeToken })

    expect(result.isRight()).toBeTruthy()
    expect(subscriptionsRepository.items[0].status).toBe(SubscriptionStatus.UNSUBSCRIBED)
    expect(subscriptionsRepository.items[0].unsubscribedAt).toBeInstanceOf(Date)
  })

  it('deve registrar o log de auditoria com o dono da assinatura como autor', async () => {
    const { subscription } = makeAuthorSubscription()
    subscriptionsRepository.items.push(subscription)

    await sut.execute({ token: subscription.unsubscribeToken })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
    expect(auditLogsRepository.items[0].actorId.toString()).toBe(subscription.subscriberId.toString())
  })

  it('não deve cancelar quando o token não existe', async () => {
    const { subscription } = makeAuthorSubscription()
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({ token: 'token-que-nao-existe' })

    expect(result.isLeft()).toBeTruthy()
    expect(subscriptionsRepository.items[0].status).toBe(SubscriptionStatus.ACTIVE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SubscriptionNotFoundError)
    }
  })

  it('não deve dar erro nem mudar a data quando a assinatura já está cancelada', async () => {
    const cancelledAt = new Date('2026-02-01T10:00:00.000Z')
    const { subscription } = makeAuthorSubscription({
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: cancelledAt,
    })
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({ token: subscription.unsubscribeToken })

    expect(result.isRight()).toBeTruthy()
    expect(subscriptionsRepository.items[0].unsubscribedAt).toEqual(cancelledAt)
    expect(auditLogsRepository.items).toHaveLength(0)
  })

  it('deve cancelar também uma assinatura marcada como devolvida', async () => {
    const { subscription } = makeAuthorSubscription({ status: SubscriptionStatus.BOUNCED })
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({ token: subscription.unsubscribeToken })

    expect(result.isRight()).toBeTruthy()
    expect(subscriptionsRepository.items[0].status).toBe(SubscriptionStatus.UNSUBSCRIBED)
  })
})
