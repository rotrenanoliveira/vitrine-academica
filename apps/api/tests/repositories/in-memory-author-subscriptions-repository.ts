import type { AuthorSubscriptionsRepository } from '@/domain/newsletter/application/repositories/author-subscriptions-repository'
import {
  type AuthorSubscription,
  SubscriptionStatus,
} from '@/domain/newsletter/enterprise/entities/author-subscription'

export class InMemoryAuthorSubscriptionsRepository implements AuthorSubscriptionsRepository {
  public items: AuthorSubscription[] = []

  async findById(id: string): Promise<AuthorSubscription | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findBySubscriberAndAuthor(subscriberId: string, authorId: string): Promise<AuthorSubscription | null> {
    return (
      this.items.find(
        (item) => item.subscriberId.toString() === subscriberId && item.authorId.toString() === authorId,
      ) ?? null
    )
  }

  async findByToken(token: string): Promise<AuthorSubscription | null> {
    return this.items.find((item) => item.unsubscribeToken === token) ?? null
  }

  async findManyBySubscriberId(subscriberId: string, status?: SubscriptionStatus): Promise<AuthorSubscription[]> {
    return this.items
      .filter(
        (item) => item.subscriberId.toString() === subscriberId && (status === undefined || item.status === status),
      )
      .sort((a, b) => b.subscribedAt.getTime() - a.subscribedAt.getTime())
  }

  async findManyActiveByAuthorId(authorId: string): Promise<AuthorSubscription[]> {
    return this.items.filter(
      (item) => item.authorId.toString() === authorId && item.status === SubscriptionStatus.ACTIVE,
    )
  }

  async create(subscription: AuthorSubscription): Promise<void> {
    this.items.push(subscription)
  }

  async save(subscription: AuthorSubscription): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === subscription.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = subscription
  }
}
