import type { FastifyReply } from 'fastify'
import type { FetchInstitutionEventsUseCase } from '@/domain/event/application/use-cases/event/fetch-institution-events'
import type { EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { EventPresenter } from '../../presenters/event-presenter'

interface FetchInstitutionEventsQuery {
  institutionId: string
  page?: number
  perPage?: number
  phase?: EventPhase
  participationScope?: ParticipationScope
}

export class FetchInstitutionEventsController {
  constructor(private readonly fetchInstitutionEvents: FetchInstitutionEventsUseCase) {}

  async handle(query: FetchInstitutionEventsQuery, reply: FastifyReply) {
    const result = await this.fetchInstitutionEvents.execute(query)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionNotFoundError) {
        return reply.status(404).send({ message: result.value.message })
      }

      throw error
    }

    return reply.status(200).send({
      events: result.value.events.map(({ event, winner, institutionName }) =>
        EventPresenter.toListHTTP(event, winner, institutionName),
      ),
    })
  }
}
