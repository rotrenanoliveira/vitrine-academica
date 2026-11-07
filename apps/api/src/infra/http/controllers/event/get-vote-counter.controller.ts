import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { NotAllowedToManageEventError } from '@/domain/event/application/_errors/not-allowed-to-manage-event-error'
import type { GetVoteCounterUseCase } from '@/domain/event/application/use-cases/vote/get-vote-counter'
import { VoteCounterPresenter } from '../../presenters/event-presenter'

export class GetVoteCounterController {
  constructor(private readonly getVoteCounter: GetVoteCounterUseCase) {}

  async handle(input: { eventId: string; actorId: string }, reply: FastifyReply) {
    const result = await this.getVoteCounter.execute(input)

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
      counter: result.value.counter.map(VoteCounterPresenter.toHTTP),
    })
  }
}
