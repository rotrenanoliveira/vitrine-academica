import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { NotEligibleForEventError } from '@/domain/event/application/_errors/not-eligible-for-event-error'
import type { GetCurrentThemeSelectionUseCase } from '@/domain/event/application/use-cases/theme/get-current-theme-selection'
import { EventPresenter, ThemePresenter } from '../../presenters/event-presenter'

export class GetCurrentThemeSelectionController {
  constructor(private readonly getCurrentThemeSelection: GetCurrentThemeSelectionUseCase) {}

  async handle(input: { eventId: string; userId: string }, reply: FastifyReply) {
    const result = await this.getCurrentThemeSelection.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof EventNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotEligibleForEventError) {
        return reply.status(403).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      event: EventPresenter.toHTTP(result.value.event),
      themes: result.value.themes.map(ThemePresenter.toHTTP),
    })
  }
}
