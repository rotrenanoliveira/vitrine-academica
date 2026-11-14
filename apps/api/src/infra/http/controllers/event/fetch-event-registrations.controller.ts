import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { NotAllowedToManageEventError } from '@/domain/event/application/_errors/not-allowed-to-manage-event-error'
import type { FetchEventRegistrationsUseCase } from '@/domain/event/application/use-cases/event-registration/fetch-event-registrations'
import type { EventRegistrationStatus } from '@/domain/event/enterprise/entities/event-registration'
import { EventRegistrationPresenter } from '../../presenters/event-presenter'
import { ProjectPresenter } from '../../presenters/project-presenter'

export class FetchEventRegistrationsController {
  constructor(private readonly fetchEventRegistrations: FetchEventRegistrationsUseCase) {}

  async handle(
    input: {
      eventId: string
      actorId: string
      status?: EventRegistrationStatus
    },
    reply: FastifyReply,
  ) {
    const result = await this.fetchEventRegistrations.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof NotAllowedToManageEventError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof EventNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      registrations: result.value.registrations.map(EventRegistrationPresenter.toHTTP),
      projects: result.value.projects.map(ProjectPresenter.toHTTP),
    })
  }
}
