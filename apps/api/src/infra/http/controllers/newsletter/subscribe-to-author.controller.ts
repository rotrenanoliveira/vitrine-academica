import type { FastifyReply } from 'fastify'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import { AlreadyFollowingAuthorError } from '@/domain/newsletter/application/_errors/already-following-author-error'
import { AuthorNotFollowableError } from '@/domain/newsletter/application/_errors/author-not-followable-error'
import { CannotFollowYourselfError } from '@/domain/newsletter/application/_errors/cannot-follow-yourself-error'
import type { SubscribeToAuthorUseCase } from '@/domain/newsletter/application/use-cases/subscribe-to-author'
import { AuthorSubscriptionPresenter } from '../../presenters/author-subscription-presenter'

interface SubscribeToAuthorParams {
  authorId: string
  subscriberId: string
}

export class SubscribeToAuthorController {
  constructor(private readonly subscribeToAuthor: SubscribeToAuthorUseCase) {}

  async handle({ authorId, subscriberId }: SubscribeToAuthorParams, reply: FastifyReply) {
    const result = await this.subscribeToAuthor.execute({ subscriberId, authorId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof AlreadyFollowingAuthorError) {
        return reply.status(409).send({ message: error.message })
      }

      if (
        error instanceof CannotFollowYourselfError ||
        error instanceof UserUnavailableError ||
        error instanceof AuthorNotFollowableError
      ) {
        return reply.status(400).send({ message: error.message })
      }

      throw error
    }

    return reply.status(201).send({
      subscription: AuthorSubscriptionPresenter.toHTTP(result.value.subscription),
    })
  }
}
