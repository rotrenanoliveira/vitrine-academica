import { type Either, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { Mail } from '@/domain/mail/application/mail/mail'
import { publicationMail } from '@/domain/mail/application/mail/messages/publication-mail'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { NotificationStatus, type PublicationNotification } from '../../enterprise/entities/publication-notification'
import type { AuthorSubscriptionsRepository } from '../repositories/author-subscriptions-repository'
import type { PublicationNotificationsRepository } from '../repositories/publication-notifications-repository'

const DEFAULT_LIMIT = 20

interface SendPendingNotificationsUseCaseRequest {
  webUrl: string
  limit?: number | undefined
}

type SendPendingNotificationsUseCaseResponse = Either<never, { sent: number; failed: number }>

export class SendPendingNotificationsUseCase {
  constructor(
    private readonly notificationsRepository: PublicationNotificationsRepository,
    private readonly subscriptionsRepository: AuthorSubscriptionsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly mail: Mail,
  ) {}

  async execute({
    webUrl,
    limit = DEFAULT_LIMIT,
  }: SendPendingNotificationsUseCaseRequest): Promise<SendPendingNotificationsUseCaseResponse> {
    const pending = await this.notificationsRepository.findManyByStatus(NotificationStatus.PENDING, limit)

    let sent = 0
    let failed = 0

    for (const notification of pending) {
      const delivered = await this.deliver(notification, webUrl)

      if (delivered) {
        sent += 1
      } else {
        failed += 1
      }
    }

    return right({ sent, failed })
  }

  private async deliver(notification: PublicationNotification, webUrl: string): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findById(notification.subscriptionId.toString())
    const project = await this.projectsRepository.findById(notification.projectId.toString())

    if (!subscription?.isActive || !project || project.status !== ProjectStatus.PUBLISHED) {
      return this.fail(notification)
    }

    const author = await this.usersRepository.findById(project.author.toString())

    if (!author) {
      return this.fail(notification)
    }

    try {
      const result = await this.mail.send(
        publicationMail({
          to: subscription.email,
          authorName: author.name,
          projectTitle: project.title,
          projectUrl: `${webUrl}/projetos/${project.id.toString()}`,
          unsubscribeUrl: `${webUrl}/newsletter/cancelar?token=${subscription.unsubscribeToken}`,
        }),
      )

      notification.markAsSent(result.id)
      await this.notificationsRepository.save(notification)

      return true
    } catch {
      return this.fail(notification)
    }
  }

  private async fail(notification: PublicationNotification): Promise<false> {
    notification.markAsFailed()
    await this.notificationsRepository.save(notification)

    return false
  }
}
