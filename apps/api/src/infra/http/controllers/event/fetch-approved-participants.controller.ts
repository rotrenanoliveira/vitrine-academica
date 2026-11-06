import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import type { FetchApprovedParticipantsUseCase } from '@/domain/event/application/use-cases/event-registration/fetch-approved-participants'
import { ProjectPresenter } from '../../presenters/project-presenter'

export class FetchApprovedParticipantsController {
  constructor(private readonly fetchApprovedParticipants: FetchApprovedParticipantsUseCase) {}

  async handle(input: { eventId: string }, reply: FastifyReply) {
    const result = await this.fetchApprovedParticipants.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof EventNotFoundError) {
        return reply.status(404).send({ message: result.value.message })
      }

      throw error
    }

    return reply.status(200).send({
      projects: result.value.projects.map(ProjectPresenter.toHTTP),
    })
  }
}
