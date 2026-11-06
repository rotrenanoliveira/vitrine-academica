import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { InvalidEventPhaseError } from '@/domain/event/application/_errors/invalid-event-phase-error'
import { InvalidThemeError } from '@/domain/event/application/_errors/invalid-theme-error'
import { NotAllowedToManageEventError } from '@/domain/event/application/_errors/not-allowed-to-manage-event-error'
import type { SelectInstitutionalThemeUseCase } from '@/domain/event/application/use-cases/event/select-institutional-theme'
import { EventPresenter } from '../../presenters/event-presenter'

export class SelectInstitutionalThemeController {
  constructor(private readonly selectInstitutionalTheme: SelectInstitutionalThemeUseCase) {}

  async handle(input: { eventId: string; themeId: string; actorId: string }, reply: FastifyReply) {
    const result = await this.selectInstitutionalTheme.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof EventNotFoundError || error instanceof InvalidThemeError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotAllowedToManageEventError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof InvalidEventPhaseError) {
        return reply.status(409).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({ event: EventPresenter.toHTTP(result.value.event) })
  }
}
