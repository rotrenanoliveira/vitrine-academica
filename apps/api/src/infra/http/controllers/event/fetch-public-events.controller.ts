import type { FastifyReply } from 'fastify'
import type { FetchPublicEventsUseCase } from '@/domain/event/application/use-cases/event/fetch-public-events'
import type { EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { EventPresenter } from '../../presenters/event-presenter'

interface FetchPublicEventsQuery {
  page?: number
  perPage?: number
  institutionIds?: string[]
  phases?: EventPhase[]
  participationScope?: ParticipationScope
}

export class FetchPublicEventsController {
  constructor(private readonly fetchPublicEvents: FetchPublicEventsUseCase) {}

  async handle(query: FetchPublicEventsQuery, reply: FastifyReply) {
    const result = await this.fetchPublicEvents.execute(query)

    if (result.isLeft()) {
      throw result.value
    }

    return reply.status(200).send({
      events: result.value.events.map(({ event, winner, institutionName }) =>
        EventPresenter.toListHTTP(event, winner, institutionName),
      ),
      total: result.value.total,
      page: result.value.page,
      perPage: result.value.perPage,
    })
  }
}
