import { type Either, left, right } from '@/core/either'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { type Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { AuthorSubscription } from '../../enterprise/entities/author-subscription'
import { PublicationNotification } from '../../enterprise/entities/publication-notification'
import type { AuthorSubscriptionsRepository } from '../repositories/author-subscriptions-repository'
import type { PublicationNotificationsRepository } from '../repositories/publication-notifications-repository'

interface CreatePublicationNotificationsUseCaseRequest {
  projectId: string
}

type CreatePublicationNotificationsUseCaseResponse = Either<ProjectNotFoundError, { created: number }>

export class CreatePublicationNotificationsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly subscriptionsRepository: AuthorSubscriptionsRepository,
    private readonly notificationsRepository: PublicationNotificationsRepository,
  ) {}

  async execute({
    projectId,
  }: CreatePublicationNotificationsUseCaseRequest): Promise<CreatePublicationNotificationsUseCaseResponse> {
    const projectResult = await this.findProjectOrFail(projectId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    if (project.status !== ProjectStatus.PUBLISHED) {
      return right({ created: 0 })
    }

    const subscriptions = await this.subscriptionsRepository.findManyActiveByAuthorId(project.author.toString())

    const created = await this.createNotifications(project, subscriptions)

    return right({ created })
  }

  private async findProjectOrFail(projectId: string): Promise<Either<ProjectNotFoundError, Project>> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    return right(project)
  }

  private async createNotifications(project: Project, subscriptions: AuthorSubscription[]): Promise<number> {
    let created = 0

    for (const subscription of subscriptions) {
      const wasCreated = await this.createNotificationIfMissing(project, subscription)

      if (wasCreated) {
        created += 1
      }
    }

    return created
  }

  private async createNotificationIfMissing(project: Project, subscription: AuthorSubscription): Promise<boolean> {
    const existing = await this.notificationsRepository.findBySubscriptionAndProject(
      subscription.id.toString(),
      project.id.toString(),
    )

    if (existing) {
      return false
    }

    await this.notificationsRepository.create(
      PublicationNotification.create({ subscriptionId: subscription.id, projectId: project.id }),
    )

    return true
  }
}
