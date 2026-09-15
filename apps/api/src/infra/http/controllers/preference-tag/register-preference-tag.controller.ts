import type { FastifyReply } from 'fastify'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { PreferenceTagAlreadyExistsError } from '@/domain/tag/application/_errors/preference-tag-already-exists-error'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { RegisterPreferenceTagUseCase } from '@/domain/tag/application/use-cases/preference-tag/register-preference-tag'
import { PreferenceTagPresenter } from '../../presenters/preference-tag-presenter'

interface RegisterPreferenceTagBody {
  userId: string
  tagId: string
}

export class RegisterPreferenceTagController {
  constructor(private readonly registerPreferenceTag: RegisterPreferenceTagUseCase) {}

  async handle({ userId, tagId }: RegisterPreferenceTagBody, reply: FastifyReply) {
    const result = await this.registerPreferenceTag.execute({ userId, tagId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError || error instanceof TagNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof PreferenceTagAlreadyExistsError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      preferenceTag: PreferenceTagPresenter.toHTTP(result.value.preferenceTag),
    })
  }
}
