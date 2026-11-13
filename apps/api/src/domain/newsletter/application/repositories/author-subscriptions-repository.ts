import type { AuthorSubscription, SubscriptionStatus } from '../../enterprise/entities/author-subscription'

export interface AuthorSubscriptionsRepository {
  findById(id: string): Promise<AuthorSubscription | null>
  findBySubscriberAndAuthor(subscriberId: string, authorId: string): Promise<AuthorSubscription | null>
  findByToken(token: string): Promise<AuthorSubscription | null>
  findManyBySubscriberId(subscriberId: string, status?: SubscriptionStatus): Promise<AuthorSubscription[]>
  findManyActiveByAuthorId(authorId: string): Promise<AuthorSubscription[]>
  create(subscription: AuthorSubscription): Promise<void>
  save(subscription: AuthorSubscription): Promise<void>
}
