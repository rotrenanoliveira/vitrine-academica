import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { NotEligibleForEventError } from '@/domain/event/application/_errors/not-eligible-for-event-error'
import type { GetMyVoteUseCase } from '@/domain/event/application/use-cases/vote/get-my-vote'
import { VotePresenter } from '../../presenters/event-presenter'

export class GetMyVoteController {
  constructor(private readonly getMyVote: GetMyVoteUseCase) {}

  async handle(input: { eventId: string; userId: string }, reply: FastifyReply) {
    const result = await this.getMyVote.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof NotEligibleForEventError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof EventNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      vote: result.value.vote ? VotePresenter.toHTTP(result.value.vote) : null,
    })
  }
}
