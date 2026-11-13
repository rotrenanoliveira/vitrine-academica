import type { FastifyReply } from 'fastify'
import type { ListMySubscriptionsUseCase } from '@/domain/newsletter/application/use-cases/list-my-subscriptions'
import type { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { AuthorSubscriptionPresenter } from '../../presenters/author-subscription-presenter'

interface ListMySubscriptionsParams {
  subscriberId: string
}

interface ListMySubscriptionsQuery {
  status?: SubscriptionStatus | undefined
}

export class ListMySubscriptionsController {
  constructor(private readonly listMySubscriptions: ListMySubscriptionsUseCase) {}

  async handle({ subscriberId }: ListMySubscriptionsParams, { status }: ListMySubscriptionsQuery, reply: FastifyReply) {
    const result = await this.listMySubscriptions.execute({ subscriberId, status })

    if (result.isLeft()) {
      throw result.value
    }

    return reply.status(200).send({
      subscriptions: result.value.subscriptions.map(AuthorSubscriptionPresenter.itemToHTTP),
    })
  }
}
