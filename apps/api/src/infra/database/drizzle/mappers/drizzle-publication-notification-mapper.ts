import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  type NotificationStatus,
  PublicationNotification,
} from '@/domain/newsletter/enterprise/entities/publication-notification'
import type { publicationNotifications } from '../schemas/publication-notifications'

type DrizzlePublicationNotification = typeof publicationNotifications.$inferSelect
type DrizzlePublicationNotificationInsert = typeof publicationNotifications.$inferInsert

export class DrizzlePublicationNotificationMapper {
  static toDomain(row: DrizzlePublicationNotification): PublicationNotification {
    return PublicationNotification.create(
      {
        subscriptionId: new UniqueEntityId(row.subscriptionId),
        projectId: new UniqueEntityId(row.projectId),
        status: row.status as NotificationStatus,
        sentAt: row.sentAt,
        providerMessageId: row.providerMessageId,
        createdAt: row.createdAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: PublicationNotification): DrizzlePublicationNotificationInsert {
    return {
      id: entity.id.toString(),
      subscriptionId: entity.subscriptionId.toString(),
      projectId: entity.projectId.toString(),
      status: entity.status,
      sentAt: entity.sentAt ?? null,
      providerMessageId: entity.providerMessageId ?? null,
      createdAt: entity.createdAt,
    }
  }
}
