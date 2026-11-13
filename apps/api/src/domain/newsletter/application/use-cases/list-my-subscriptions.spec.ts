import { makeAuthorSubscription } from '@tests/factories/make-author-subscription'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuthorSubscriptionsRepository } from '@tests/repositories/in-memory-author-subscriptions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { ListMySubscriptionsUseCase } from './list-my-subscriptions'

let usersRepository: InMemoryUsersRepository
let subscriptionsRepository: InMemoryAuthorSubscriptionsRepository
let sut: ListMySubscriptionsUseCase

describe('(UC) - List My Subscriptions', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    subscriptionsRepository = new InMemoryAuthorSubscriptionsRepository()

    sut = new ListMySubscriptionsUseCase(usersRepository, subscriptionsRepository)
  })

  it('deve listar as assinaturas ativas da pessoa, com o autor de cada uma', async () => {
    const { user: subscriber } = makeUser()
    const { user: author } = makeUser()
    usersRepository.items.push(subscriber, author)
    const { subscription } = makeAuthorSubscription({ subscriberId: subscriber.id, authorId: author.id })
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({ subscriberId: subscriber.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.subscriptions).toHaveLength(1)
      expect(result.value.subscriptions[0].subscription.id.toString()).toBe(subscription.id.toString())
      expect(result.value.subscriptions[0].author?.name).toBe(author.name)
    }
  })

  it('não deve listar assinaturas de outras pessoas', async () => {
    const { user: subscriber } = makeUser()
    const { subscription: mine } = makeAuthorSubscription({ subscriberId: subscriber.id })
    const { subscription: other } = makeAuthorSubscription()
    subscriptionsRepository.items.push(mine, other)

    const result = await sut.execute({ subscriberId: subscriber.id.toString() })

    if (result.isRight()) {
      expect(result.value.subscriptions).toHaveLength(1)
      expect(result.value.subscriptions[0].subscription.id.toString()).toBe(mine.id.toString())
    }
  })

  it('não deve listar as assinaturas canceladas por padrão', async () => {
    const subscriberId = new UniqueEntityId()
    const { subscription: active } = makeAuthorSubscription({ subscriberId })
    const { subscription: cancelled } = makeAuthorSubscription({
      subscriberId,
      status: SubscriptionStatus.UNSUBSCRIBED,
    })
    subscriptionsRepository.items.push(active, cancelled)

    const result = await sut.execute({ subscriberId: subscriberId.toString() })

    if (result.isRight()) {
      expect(result.value.subscriptions).toHaveLength(1)
      expect(result.value.subscriptions[0].subscription.id.toString()).toBe(active.id.toString())
    }
  })

  it('deve filtrar pelo status informado', async () => {
    const subscriberId = new UniqueEntityId()
    const { subscription: active } = makeAuthorSubscription({ subscriberId })
    const { subscription: cancelled } = makeAuthorSubscription({
      subscriberId,
      status: SubscriptionStatus.UNSUBSCRIBED,
    })
    subscriptionsRepository.items.push(active, cancelled)

    const result = await sut.execute({
      subscriberId: subscriberId.toString(),
      status: SubscriptionStatus.UNSUBSCRIBED,
    })

    if (result.isRight()) {
      expect(result.value.subscriptions).toHaveLength(1)
      expect(result.value.subscriptions[0].subscription.id.toString()).toBe(cancelled.id.toString())
    }
  })

  it('deve listar da assinatura mais nova para a mais antiga', async () => {
    const subscriberId = new UniqueEntityId()
    const { subscription: oldest } = makeAuthorSubscription({
      subscriberId,
      subscribedAt: new Date('2026-01-01T10:00:00.000Z'),
    })
    const { subscription: newest } = makeAuthorSubscription({
      subscriberId,
      subscribedAt: new Date('2026-03-01T10:00:00.000Z'),
    })
    subscriptionsRepository.items.push(oldest, newest)

    const result = await sut.execute({ subscriberId: subscriberId.toString() })

    if (result.isRight()) {
      expect(result.value.subscriptions.map((item) => item.subscription.id.toString())).toEqual([
        newest.id.toString(),
        oldest.id.toString(),
      ])
    }
  })

  it('deve devolver uma lista vazia quando a pessoa não acompanha ninguém', async () => {
    const result = await sut.execute({ subscriberId: new UniqueEntityId().toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.subscriptions).toEqual([])
    }
  })

  it('deve devolver o autor nulo quando a conta do autor não existe mais', async () => {
    const subscriberId = new UniqueEntityId()
    const { subscription } = makeAuthorSubscription({ subscriberId })
    subscriptionsRepository.items.push(subscription)

    const result = await sut.execute({ subscriberId: subscriberId.toString() })

    if (result.isRight()) {
      expect(result.value.subscriptions[0].author).toBeNull()
    }
  })
})
