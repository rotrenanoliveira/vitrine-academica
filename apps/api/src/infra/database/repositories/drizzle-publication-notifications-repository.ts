import { and, asc, eq, type SQL } from 'drizzle-orm'
import type { PublicationNotificationsRepository } from '@/domain/newsletter/application/repositories/publication-notifications-repository'
import type {
  NotificationStatus,
  PublicationNotification,
} from '@/domain/newsletter/enterprise/entities/publication-notification'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzlePublicationNotificationMapper } from '../drizzle/mappers/drizzle-publication-notification-mapper'
import { publicationNotifications } from '../drizzle/schemas'

export class DrizzlePublicationNotificationsRepository implements PublicationNotificationsRepository {
  constructor(private readonly db: DrizzleClient) {}

  private async findOne(condition: SQL | undefined): Promise<PublicationNotification | null> {
    const [row] = await this.db.select().from(publicationNotifications).where(condition).limit(1)

    return row ? DrizzlePublicationNotificationMapper.toDomain(row) : null
  }

  async findById(id: string): Promise<PublicationNotification | null> {
    return this.findOne(eq(publicationNotifications.id, id))
  }

  async findBySubscriptionAndProject(
    subscriptionId: string,
    projectId: string,
  ): Promise<PublicationNotification | null> {
    return this.findOne(
      and(
        eq(publicationNotifications.subscriptionId, subscriptionId),
        eq(publicationNotifications.projectId, projectId),
      ),
    )
  }

  async findManyByStatus(status: NotificationStatus, limit: number): Promise<PublicationNotification[]> {
    const rows = await this.db
      .select()
      .from(publicationNotifications)
      .where(eq(publicationNotifications.status, status))
      .orderBy(asc(publicationNotifications.createdAt))
      .limit(limit)

    return rows.map(DrizzlePublicationNotificationMapper.toDomain)
  }

  async create(entity: PublicationNotification): Promise<void> {
    await this.db.insert(publicationNotifications).values(DrizzlePublicationNotificationMapper.toPersistence(entity))
  }

  async save(entity: PublicationNotification): Promise<void> {
    await this.db
      .update(publicationNotifications)
      .set(DrizzlePublicationNotificationMapper.toPersistence(entity))
      .where(eq(publicationNotifications.id, entity.id.toString()))
  }
}
