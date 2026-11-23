import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { type User, UserStatus } from '@/domain/identity/enterprise/entities/user'
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

  async execute({
    subscriberId,
    authorId,
  }: SubscribeToAuthorUseCaseRequest): Promise<SubscribeToAuthorUseCaseResponse> {
    const selfFollowResult = await this.validateNotSelfFollow(subscriberId, authorId)

    if (selfFollowResult.isLeft()) {
      return left(selfFollowResult.value)
    }

    const subscriberResult = await this.findActiveSubscriberOrFail(subscriberId, authorId)

    if (subscriberResult.isLeft()) {
      return left(subscriberResult.value)
    }

    const subscriber = subscriberResult.value

    const authorResult = await this.findAuthorOrFail(authorId, subscriberId)

    if (authorResult.isLeft()) {
      return left(authorResult.value)
    }

    const author = authorResult.value

    const followableResult = await this.validateAuthorHasPublishedProjects(authorId, subscriberId)

    if (followableResult.isLeft()) {
      return left(followableResult.value)
    }

    const existingResult = await this.validateNotAlreadyFollowing(subscriberId, authorId)

    if (existingResult.isLeft()) {
      return left(existingResult.value)
    }

    const existing = existingResult.value

    if (existing) {
      await this.resubscribe(existing, subscriber, authorId)

      return right({ subscription: existing })
    }

    const subscription = await this.createSubscription(subscriber, author)

    return right({ subscription })
  }

  private async log({
    actorId,
    sessionId,
    resourceId,
    text,
    status,
    diff,
    action = AuditLogAction.CREATE,
  }: LogParams & { action?: AuditLogAction }) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action,
      resource: 'author.subscription',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async validateNotSelfFollow(
    subscriberId: string,
    authorId: string,
  ): Promise<Either<CannotFollowYourselfError, null>> {
    if (subscriberId === authorId) {
      await this.log({
        actorId: subscriberId,
        resourceId: authorId,
        text: `Usuário ${subscriberId} tentou acompanhar a si mesmo.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new CannotFollowYourselfError())
    }

    return right(null)
  }

  private async findActiveSubscriberOrFail(
    subscriberId: string,
    authorId: string,
  ): Promise<Either<UserNotFoundError | UserUnavailableError, User>> {
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

    return right(subscriber)
  }

  private async findAuthorOrFail(authorId: string, subscriberId: string): Promise<Either<UserNotFoundError, User>> {
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

    return right(author)
  }

  private async validateAuthorHasPublishedProjects(
    authorId: string,
    subscriberId: string,
  ): Promise<Either<AuthorNotFollowableError, null>> {
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

    return right(null)
  }

  private async validateNotAlreadyFollowing(
    subscriberId: string,
    authorId: string,
  ): Promise<Either<AlreadyFollowingAuthorError, AuthorSubscription | null>> {
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

    return right(existing ?? null)
  }

  private async resubscribe(existing: AuthorSubscription, subscriber: User, authorId: string) {
    const subscriberId = subscriber.id.toString()

    existing.resubscribe(subscriber.email)
    await this.subscriptionsRepository.save(existing)

    await this.log({
      actorId: subscriberId,
      resourceId: existing.id.toString(),
      action: AuditLogAction.UPDATE,
      text: `Usuário ${subscriberId} voltou a acompanhar o autor ${authorId}.`,
      status: AuditLogStatus.SUCCESS,
    })
  }

  private async createSubscription(subscriber: User, author: User): Promise<AuthorSubscription> {
    const subscription = AuthorSubscription.create({
      subscriberId: subscriber.id,
      authorId: author.id,
      email: subscriber.email,
    })

    await this.subscriptionsRepository.create(subscription)

    await this.log({
      actorId: subscriber.id.toString(),
      resourceId: subscription.id.toString(),
      text: `Usuário ${subscriber.id.toString()} passou a acompanhar o autor ${author.id.toString()}.`,
      status: AuditLogStatus.SUCCESS,
    })

    return subscription
  }
}
