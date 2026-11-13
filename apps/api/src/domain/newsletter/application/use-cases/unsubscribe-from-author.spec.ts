import { makeAuthorSubscription } from '@tests/factories/make-author-subscription'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryAuthorSubscriptionsRepository } from '@tests/repositories/in-memory-author-subscriptions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { NotSubscriptionOwnerError } from '@/domain/newsletter/application/_errors/not-subscription-owner-error'
import { SubscriptionNotFoundError } from '@/domain/newsletter/application/_errors/subscription-not-found-error'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { UnsubscribeFromAuthorUseCase } from './unsubscribe-from-author'

let subscriptionsRepository: InMemoryAuthorSubscriptionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: UnsubscribeFromAuthorUseCase

describe('(UC) - Unsubscribe From Author', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryAuthorSubscriptionsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new UnsubscribeFromAuthorUseCase(subscriptionsRepository, registerLog)
  })

  it('deve cancelar uma assinatura ativa, registrando a data do cancelamento', async () => {
    const subscriberId = new UniqueEntityId()
    const { subscription } = makeAuthorSubscription({ subscriberId })
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({
      subscriptionId: subscription.id.toString(),
      requesterId: subscriberId.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(subscriptionsRepository.items[0].status).toBe(SubscriptionStatus.UNSUBSCRIBED)
    expect(subscriptionsRepository.items[0].unsubscribedAt).toBeInstanceOf(Date)
  })

  it('deve registrar um log de auditoria quando a assinatura é cancelada', async () => {
    const subscriberId = new UniqueEntityId()
    const { subscription } = makeAuthorSubscription({ subscriberId })
    subscriptionsRepository.items.push(subscription)

    await sut.execute({ subscriptionId: subscription.id.toString(), requesterId: subscriberId.toString() })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('não deve cancelar uma assinatura que não existe', async () => {
    const result = await sut.execute({
      subscriptionId: 'assinatura-inexistente',
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SubscriptionNotFoundError)
    }
  })

  it('não deve deixar outra pessoa cancelar a assinatura', async () => {
    const { subscription } = makeAuthorSubscription()
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({
      subscriptionId: subscription.id.toString(),
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(subscriptionsRepository.items[0].status).toBe(SubscriptionStatus.ACTIVE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotSubscriptionOwnerError)
    }
  })

  it('não deve dar erro ao cancelar uma assinatura já cancelada e deve manter a data', async () => {
    const subscriberId = new UniqueEntityId()
    const cancelledAt = new Date('2026-02-01T10:00:00.000Z')
    const { subscription } = makeAuthorSubscription({
      subscriberId,
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: cancelledAt,
    })
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({
      subscriptionId: subscription.id.toString(),
      requesterId: subscriberId.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(subscriptionsRepository.items[0].unsubscribedAt).toEqual(cancelledAt)
  })
})
