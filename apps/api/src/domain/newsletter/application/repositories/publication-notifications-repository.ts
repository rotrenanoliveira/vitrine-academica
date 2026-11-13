import type { NotificationStatus, PublicationNotification } from '../../enterprise/entities/publication-notification'

export interface PublicationNotificationsRepository {
  findById(id: string): Promise<PublicationNotification | null>
  findBySubscriptionAndProject(subscriptionId: string, projectId: string): Promise<PublicationNotification | null>
  findManyByStatus(status: NotificationStatus, limit: number): Promise<PublicationNotification[]>
  create(notification: PublicationNotification): Promise<void>
  save(notification: PublicationNotification): Promise<void>
}
