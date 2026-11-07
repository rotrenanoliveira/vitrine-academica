import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { NotAllowedToManageEventError } from '@/domain/event/application/_errors/not-allowed-to-manage-event-error'
import type { EditEventNameUseCase } from '@/domain/event/application/use-cases/event/edit-event-name'
import { EventPresenter } from '../../presenters/event-presenter'

export class EditEventNameController {
  constructor(private readonly editEventName: EditEventNameUseCase) {}

  async handle(input: { eventId: string; actorId: string; name: string }, reply: FastifyReply) {
    const result = await this.editEventName.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof EventNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotAllowedToManageEventError) {
        return reply.status(403).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({ event: EventPresenter.toHTTP(result.value.event) })
  }
}
