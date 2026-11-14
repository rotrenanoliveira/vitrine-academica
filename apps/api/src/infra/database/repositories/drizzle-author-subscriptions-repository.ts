import { and, desc, eq, type SQL } from 'drizzle-orm'
import type { AuthorSubscriptionsRepository } from '@/domain/newsletter/application/repositories/author-subscriptions-repository'
import {
  type AuthorSubscription,
  SubscriptionStatus,
} from '@/domain/newsletter/enterprise/entities/author-subscription'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleAuthorSubscriptionMapper } from '../drizzle/mappers/drizzle-author-subscription-mapper'
import { authorSubscriptions } from '../drizzle/schemas'

export class DrizzleAuthorSubscriptionsRepository implements AuthorSubscriptionsRepository {
  constructor(private readonly db: DrizzleClient) {}

  private async findOne(condition: SQL | undefined): Promise<AuthorSubscription | null> {
    const [row] = await this.db.select().from(authorSubscriptions).where(condition).limit(1)

    return row ? DrizzleAuthorSubscriptionMapper.toDomain(row) : null
  }

  async findById(id: string): Promise<AuthorSubscription | null> {
    return this.findOne(eq(authorSubscriptions.id, id))
  }

  async findBySubscriberAndAuthor(subscriberId: string, authorId: string): Promise<AuthorSubscription | null> {
    return this.findOne(
      and(eq(authorSubscriptions.subscriberId, subscriberId), eq(authorSubscriptions.authorId, authorId)),
    )
  }

  async findByToken(token: string): Promise<AuthorSubscription | null> {
    return this.findOne(eq(authorSubscriptions.unsubscribeToken, token))
  }

  async findManyBySubscriberId(subscriberId: string, status?: SubscriptionStatus): Promise<AuthorSubscription[]> {
    const filter = status
      ? and(eq(authorSubscriptions.subscriberId, subscriberId), eq(authorSubscriptions.status, status))
      : eq(authorSubscriptions.subscriberId, subscriberId)

    const rows = await this.db
      .select()
      .from(authorSubscriptions)
      .where(filter)
      .orderBy(desc(authorSubscriptions.subscribedAt))

    return rows.map(DrizzleAuthorSubscriptionMapper.toDomain)
  }

  async findManyActiveByAuthorId(authorId: string): Promise<AuthorSubscription[]> {
    const rows = await this.db
      .select()
      .from(authorSubscriptions)
      .where(and(eq(authorSubscriptions.authorId, authorId), eq(authorSubscriptions.status, SubscriptionStatus.ACTIVE)))

    return rows.map(DrizzleAuthorSubscriptionMapper.toDomain)
  }

  async create(entity: AuthorSubscription): Promise<void> {
    await this.db.insert(authorSubscriptions).values(DrizzleAuthorSubscriptionMapper.toPersistence(entity))
  }

  async save(entity: AuthorSubscription): Promise<void> {
    await this.db
      .update(authorSubscriptions)
      .set(DrizzleAuthorSubscriptionMapper.toPersistence(entity))
      .where(eq(authorSubscriptions.id, entity.id.toString()))
  }
}
