import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { InvalidRegistrationStatusError } from '@/domain/event/application/_errors/invalid-registration-status-error'
import { NotAllowedToManageEventError } from '@/domain/event/application/_errors/not-allowed-to-manage-event-error'
import type { ReviewEventRegistrationUseCase } from '@/domain/event/application/use-cases/event-registration/review-event-registration'
import { EventRegistrationPresenter } from '../../presenters/event-presenter'

interface ReviewEventRegistrationBody {
  registrationId: string
  actorId: string
  action: 'APPROVE' | 'REJECT'
  reason?: string | null
}

export class ReviewEventRegistrationController {
  constructor(private readonly reviewEventRegistration: ReviewEventRegistrationUseCase) {}

  async handle(input: ReviewEventRegistrationBody, reply: FastifyReply) {
    const result = await this.reviewEventRegistration.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof EventNotFoundError || error instanceof InvalidRegistrationStatusError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotAllowedToManageEventError) {
        return reply.status(403).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      registration: EventRegistrationPresenter.toHTTP(result.value.registration),
    })
  }
}
