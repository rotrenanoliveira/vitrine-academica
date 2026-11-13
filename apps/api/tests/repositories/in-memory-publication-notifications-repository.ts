import type { PublicationNotificationsRepository } from '@/domain/newsletter/application/repositories/publication-notifications-repository'
import type {
  NotificationStatus,
  PublicationNotification,
} from '@/domain/newsletter/enterprise/entities/publication-notification'

export class InMemoryPublicationNotificationsRepository implements PublicationNotificationsRepository {
  public items: PublicationNotification[] = []

  async findById(id: string): Promise<PublicationNotification | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findBySubscriptionAndProject(
    subscriptionId: string,
    projectId: string,
  ): Promise<PublicationNotification | null> {
    return (
      this.items.find(
        (item) => item.subscriptionId.toString() === subscriptionId && item.projectId.toString() === projectId,
      ) ?? null
    )
  }

  async findManyByStatus(status: NotificationStatus, limit: number): Promise<PublicationNotification[]> {
    return this.items
      .filter((item) => item.status === status)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit)
  }

  async create(notification: PublicationNotification): Promise<void> {
    this.items.push(notification)
  }

  async save(notification: PublicationNotification): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === notification.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = notification
  }
}
