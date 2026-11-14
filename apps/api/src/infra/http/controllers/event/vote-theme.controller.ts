import type { FastifyReply } from 'fastify'
import { DuplicateVoteError } from '@/domain/event/application/_errors/duplicate-vote-error'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { EventWindowClosedError } from '@/domain/event/application/_errors/event-window-closed-error'
import { InvalidThemeError } from '@/domain/event/application/_errors/invalid-theme-error'
import { NotEligibleForEventError } from '@/domain/event/application/_errors/not-eligible-for-event-error'
import type { VoteThemeUseCase } from '@/domain/event/application/use-cases/vote/vote-theme'
import { VotePresenter } from '../../presenters/event-presenter'

export class VoteThemeController {
  constructor(private readonly voteTheme: VoteThemeUseCase) {}

  async handle(input: { eventId: string; themeId: string; userId: string }, reply: FastifyReply) {
    const result = await this.voteTheme.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof EventNotFoundError || error instanceof InvalidThemeError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotEligibleForEventError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof EventWindowClosedError || error instanceof DuplicateVoteError) {
        return reply.status(409).send({ message: error.message })
      }

      throw error
    }

    return reply.status(201).send({ vote: VotePresenter.toHTTP(result.value.vote) })
  }
}
