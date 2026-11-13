import type { FastifyReply } from 'fastify'
import { NotSubscriptionOwnerError } from '@/domain/newsletter/application/_errors/not-subscription-owner-error'
import { SubscriptionNotFoundError } from '@/domain/newsletter/application/_errors/subscription-not-found-error'
import type { UnsubscribeFromAuthorUseCase } from '@/domain/newsletter/application/use-cases/unsubscribe-from-author'
import { AuthorSubscriptionPresenter } from '../../presenters/author-subscription-presenter'

interface UnsubscribeFromAuthorParams {
  subscriptionId: string
  requesterId: string
}

export class UnsubscribeFromAuthorController {
  constructor(private readonly unsubscribeFromAuthor: UnsubscribeFromAuthorUseCase) {}

  async handle({ subscriptionId, requesterId }: UnsubscribeFromAuthorParams, reply: FastifyReply) {
    const result = await this.unsubscribeFromAuthor.execute({ subscriptionId, requesterId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof SubscriptionNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotSubscriptionOwnerError) {
        return reply.status(403).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      subscription: AuthorSubscriptionPresenter.toHTTP(result.value.subscription),
    })
  }
}
