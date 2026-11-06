import type { FastifyReply } from 'fastify'
import { DuplicateRegistrationError } from '@/domain/event/application/_errors/duplicate-registration-error'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { EventWindowClosedError } from '@/domain/event/application/_errors/event-window-closed-error'
import { NotEligibleForEventError } from '@/domain/event/application/_errors/not-eligible-for-event-error'
import { NotEventProjectOwnerError } from '@/domain/event/application/_errors/not-project-owner-error'
import { ProjectNotPublishedError } from '@/domain/event/application/_errors/project-not-published-error'
import type { RegisterProjectInEventUseCase } from '@/domain/event/application/use-cases/event-registration/register-project-in-event'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { EventRegistrationPresenter } from '../../presenters/event-presenter'

export class RegisterProjectInEventController {
  constructor(private readonly registerProjectInEvent: RegisterProjectInEventUseCase) {}

  async handle(input: { eventId: string; projectId: string; userId: string }, reply: FastifyReply) {
    const result = await this.registerProjectInEvent.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof EventNotFoundError || error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotEligibleForEventError || error instanceof NotEventProjectOwnerError) {
        return reply.status(403).send({ message: error.message })
      }

      if (
        error instanceof EventWindowClosedError ||
        error instanceof DuplicateRegistrationError ||
        error instanceof ProjectNotPublishedError
      ) {
        return reply.status(409).send({ message: error.message })
      }

      throw error
    }

    return reply.status(201).send({
      registration: EventRegistrationPresenter.toHTTP(result.value.registration),
    })
  }
}
