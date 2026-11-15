import type { FastifyReply } from 'fastify'
import type { FetchMyEventRegistrationsUseCase } from '@/domain/event/application/use-cases/event-registration/fetch-my-event-registrations'
import { EventRegistrationPresenter } from '../../presenters/event-presenter'

interface FetchMyEventRegistrationsParams {
  userId: string
}

export class FetchMyEventRegistrationsController {
  constructor(private readonly fetchMyEventRegistrations: FetchMyEventRegistrationsUseCase) {}

  async handle({ userId }: FetchMyEventRegistrationsParams, reply: FastifyReply) {
    const result = await this.fetchMyEventRegistrations.execute({ userId })

    return reply.status(200).send({
      registrations: result.value.registrations.map(EventRegistrationPresenter.toHTTPWithContext),
    })
  }
}
