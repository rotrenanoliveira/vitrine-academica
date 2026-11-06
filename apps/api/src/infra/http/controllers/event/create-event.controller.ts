import type { FastifyReply } from 'fastify'
import { NotAllowedToManageEventError } from '@/domain/event/application/_errors/not-allowed-to-manage-event-error'
import type { CreateEventUseCase } from '@/domain/event/application/use-cases/event/create-event'
import type { ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { EventPresenter } from '../../presenters/event-presenter'

interface CreateEventBody {
  institutionId: string
  actorId: string
  participationScope: ParticipationScope
  name?: string | null
}

export class CreateEventController {
  constructor(private readonly createEvent: CreateEventUseCase) {}

  async handle(body: CreateEventBody, reply: FastifyReply) {
    const result = await this.createEvent.execute(body)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotAllowedToManageEventError) {
        return reply.status(403).send({ message: error.message })
      }

      throw error
    }

    return reply.status(201).send({ event: EventPresenter.toHTTP(result.value.event) })
  }
}
