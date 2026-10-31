import type { FastifyReply } from 'fastify'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { PreferenceTagNotFoundError } from '@/domain/tag/application/_errors/preference-tag-not-found-error'
import type { DeactivatePreferenceTagUseCase } from '@/domain/tag/application/use-cases/preference-tag/deactivate-preference-tag'
import { PreferenceTagPresenter } from '../../presenters/preference-tag-presenter'

interface DeactivatePreferenceTagParams {
  userId: string
  tagId: string
}

export class DeactivatePreferenceTagController {
  constructor(private readonly deactivatePreferenceTag: DeactivatePreferenceTagUseCase) {}

  async handle({ userId, tagId }: DeactivatePreferenceTagParams, reply: FastifyReply) {
    const result = await this.deactivatePreferenceTag.execute({ userId, tagId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError || error instanceof PreferenceTagNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      preferenceTag: PreferenceTagPresenter.toHTTP(result.value.preferenceTag),
    })
  }
}
