import type { FastifyReply } from 'fastify'
import type { FetchApprovedThemesUseCase } from '@/domain/event/application/use-cases/theme/fetch-approved-themes'
import { ThemePresenter } from '../../presenters/event-presenter'

export class FetchApprovedThemesController {
  constructor(private readonly fetchApprovedThemes: FetchApprovedThemesUseCase) {}

  async handle(input: { eventId: string }, reply: FastifyReply) {
    const result = await this.fetchApprovedThemes.execute(input)

    if (result.isLeft()) {
      return reply.status(404).send({ message: result.value.message })
    }

    return reply.status(200).send({
      themes: result.value.themes.map(ThemePresenter.toHTTP),
    })
  }
}
