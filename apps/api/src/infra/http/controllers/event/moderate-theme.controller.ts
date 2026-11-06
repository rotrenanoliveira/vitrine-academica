import type { FastifyReply } from 'fastify'
import { EventNotFoundError } from '@/domain/event/application/_errors/event-not-found-error'
import { InvalidThemeError } from '@/domain/event/application/_errors/invalid-theme-error'
import { NotAllowedToManageEventError } from '@/domain/event/application/_errors/not-allowed-to-manage-event-error'
import type { ModerateThemeUseCase } from '@/domain/event/application/use-cases/theme/moderate-theme'
import { ThemePresenter } from '../../presenters/event-presenter'

export class ModerateThemeController {
  constructor(private readonly moderateTheme: ModerateThemeUseCase) {}

  async handle(
    input: { themeId: string; actorId: string; action: 'APPROVE' | 'REJECT' | 'HIDE'; reason?: string | null },
    reply: FastifyReply,
  ) {
    const result = await this.moderateTheme.execute(input)

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InvalidThemeError) {
        return reply.status(400).send({ message: error.message })
      }

      if (error instanceof EventNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotAllowedToManageEventError) {
        return reply.status(403).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({ theme: ThemePresenter.toHTTP(result.value.theme) })
  }
}
