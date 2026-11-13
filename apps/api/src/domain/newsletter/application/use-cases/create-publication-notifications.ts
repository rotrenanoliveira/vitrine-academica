import { type Either, left, right } from '@/core/either'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
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
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    if (project.status !== ProjectStatus.PUBLISHED) {
      return right({ created: 0 })
    }

    const subscriptions = await this.subscriptionsRepository.findManyActiveByAuthorId(project.author.toString())

    let created = 0

    for (const subscription of subscriptions) {
      const existing = await this.notificationsRepository.findBySubscriptionAndProject(
        subscription.id.toString(),
        projectId,
      )

      if (existing) {
        continue
      }

      await this.notificationsRepository.create(
        PublicationNotification.create({ subscriptionId: subscription.id, projectId: project.id }),
      )

      created += 1
    }

    return right({ created })
  }
}
