import type { FastifyReply } from 'fastify'
import type { GetPublicEventUseCase } from '@/domain/event/application/use-cases/event/get-public-event'
import { EventPresenter } from '../../presenters/event-presenter'

export class GetPublicEventController {
  constructor(private readonly getPublicEvent: GetPublicEventUseCase) {}

  async handle(input: { eventId?: string; eventSlug?: string }, reply: FastifyReply) {
    const result = await this.getPublicEvent.execute(input)

    if (result.isLeft()) {
      return reply.status(404).send({ message: result.value.message })
    }

    return reply.status(200).send({ event: EventPresenter.toHTTP(result.value.event) })
  }
}
