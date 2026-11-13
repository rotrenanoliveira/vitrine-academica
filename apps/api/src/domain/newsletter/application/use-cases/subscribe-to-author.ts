import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { AuthorSubscription } from '../../enterprise/entities/author-subscription'
import { AlreadyFollowingAuthorError } from '../_errors/already-following-author-error'
import { AuthorNotFollowableError } from '../_errors/author-not-followable-error'
import { CannotFollowYourselfError } from '../_errors/cannot-follow-yourself-error'
import type { AuthorSubscriptionsRepository } from '../repositories/author-subscriptions-repository'

interface SubscribeToAuthorUseCaseRequest {
  subscriberId: string
  authorId: string
}

type LogParams = {
  actorId: string
  resourceId: string
  action?: AuditLogAction
  text: string
  status: AuditLogStatus
}

type SubscribeToAuthorUseCaseResponse = Either<
  | CannotFollowYourselfError
  | UserNotFoundError
  | UserUnavailableError
  | AuthorNotFollowableError
  | AlreadyFollowingAuthorError,
  { subscription: AuthorSubscription }
>

export class SubscribeToAuthorUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly subscriptionsRepository: AuthorSubscriptionsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, action = AuditLogAction.CREATE, text, status }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action,
      resource: 'author.subscription',
      resourceId,
      diff: null,
      status,
      text,
    })
  }

  async execute({
    subscriberId,
    authorId,
  }: SubscribeToAuthorUseCaseRequest): Promise<SubscribeToAuthorUseCaseResponse> {
    if (subscriberId === authorId) {
      await this.log({
        actorId: subscriberId,
        resourceId: authorId,
        text: `Usuário ${subscriberId} tentou acompanhar a si mesmo.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotFollowYourselfError())
    }

    const subscriber = await this.usersRepository.findById(subscriberId)

    if (!subscriber) {
      await this.log({
        actorId: subscriberId,
        resourceId: authorId,
        text: `Usuário ${subscriberId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotFoundError())
    }

    if (subscriber.status !== UserStatus.ACTIVE) {
      await this.log({
        actorId: subscriberId,
        resourceId: authorId,
        text: `Usuário ${subscriberId} está indisponível para acompanhar autores.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserUnavailableError('Usuário indisponível para acompanhar autores'))
    }

    const author = await this.usersRepository.findById(authorId)

    if (!author) {
      await this.log({
        actorId: subscriberId,
        resourceId: authorId,
        text: `Autor ${authorId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new UserNotFoundError('Autor não encontrado'))
    }

    const publishedProjects = await this.projectsRepository.findManyByAuthorId(authorId, ProjectStatus.PUBLISHED)

    if (publishedProjects.length === 0) {
      await this.log({
        actorId: subscriberId,
        resourceId: authorId,
        text: `Autor ${authorId} não tem projetos publicados.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new AuthorNotFollowableError())
    }

    const existing = await this.subscriptionsRepository.findBySubscriberAndAuthor(subscriberId, authorId)

    if (existing?.isActive) {
      await this.log({
        actorId: subscriberId,
        resourceId: existing.id.toString(),
        text: `Usuário ${subscriberId} já acompanha o autor ${authorId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new AlreadyFollowingAuthorError())
    }

    if (existing) {
      existing.resubscribe(subscriber.email)
      await this.subscriptionsRepository.save(existing)

      await this.log({
        actorId: subscriberId,
        resourceId: existing.id.toString(),
        action: AuditLogAction.UPDATE,
        text: `Usuário ${subscriberId} voltou a acompanhar o autor ${authorId}.`,
        status: AuditLogStatus.SUCCESS,
      })

      return right({ subscription: existing })
    }

    const subscription = AuthorSubscription.create({
      subscriberId: subscriber.id,
      authorId: author.id,
      email: subscriber.email,
    })

    await this.subscriptionsRepository.create(subscription)

    await this.log({
      actorId: subscriberId,
      resourceId: subscription.id.toString(),
      text: `Usuário ${subscriberId} passou a acompanhar o autor ${authorId}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return right({ subscription })
  }
}
