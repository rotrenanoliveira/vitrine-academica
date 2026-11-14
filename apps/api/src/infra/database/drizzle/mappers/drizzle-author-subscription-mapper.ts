import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  AuthorSubscription,
  type SubscriptionStatus,
} from '@/domain/newsletter/enterprise/entities/author-subscription'
import type { authorSubscriptions } from '../schemas/author-subscriptions'

type DrizzleAuthorSubscription = typeof authorSubscriptions.$inferSelect
type DrizzleAuthorSubscriptionInsert = typeof authorSubscriptions.$inferInsert

export class DrizzleAuthorSubscriptionMapper {
  static toDomain(row: DrizzleAuthorSubscription): AuthorSubscription {
    return AuthorSubscription.create(
      {
        subscriberId: new UniqueEntityId(row.subscriberId),
        authorId: new UniqueEntityId(row.authorId),
        email: row.email,
        unsubscribeToken: row.unsubscribeToken,
        status: row.status as SubscriptionStatus,
        subscribedAt: row.subscribedAt,
        unsubscribedAt: row.unsubscribedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: AuthorSubscription): DrizzleAuthorSubscriptionInsert {
    return {
      id: entity.id.toString(),
      subscriberId: entity.subscriberId.toString(),
      authorId: entity.authorId.toString(),
      email: entity.email,
      unsubscribeToken: entity.unsubscribeToken,
      status: entity.status,
      subscribedAt: entity.subscribedAt,
      unsubscribedAt: entity.unsubscribedAt ?? null,
    }
  }
}
