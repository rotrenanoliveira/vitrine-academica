import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { EventWindowClosedError } from '@/domain/event/application/_errors/event-window-closed-error'
import { NotEligibleForEventError } from '@/domain/event/application/_errors/not-eligible-for-event-error'
import type { SuggestThemeUseCase } from '@/domain/event/application/use-cases/theme/suggest-theme'
import { ThemePresenter } from '../../presenters/event-presenter'

export class SuggestThemeController {
  constructor(private readonly suggestTheme: SuggestThemeUseCase) {}

  async handle(input: { eventId: string; authorId: string; title: string; description: string }, reply: FastifyReply) {
    const result = await this.suggestTheme.execute(input)

    if (result.isLeft()) {
      const error = result.value
      if (error instanceof EventNotFoundError) return reply.status(404).send({ message: error.message })
      if (error instanceof NotEligibleForEventError) return reply.status(403).send({ message: error.message })
      if (error instanceof EventWindowClosedError) return reply.status(409).send({ message: error.message })
      throw error
    }

    return reply.status(201).send({ theme: ThemePresenter.toHTTP(result.value.theme) })
  }
}
