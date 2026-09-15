import type { FastifyReply } from 'fastify'
import type { FetchUserPreferenceTagsUseCase } from '@/domain/tag/application/use-cases/preference-tag/fetch-user-preference-tags'
import { PreferenceTagPresenter } from '../../presenters/preference-tag-presenter'

interface FetchUserPreferenceTagsParams {
  userId: string
}

export class FetchUserPreferenceTagsController {
  constructor(private readonly fetchUserPreferenceTags: FetchUserPreferenceTagsUseCase) {}

  async handle({ userId }: FetchUserPreferenceTagsParams, reply: FastifyReply) {
    const result = await this.fetchUserPreferenceTags.execute({ userId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    return reply.status(200).send({
      preferenceTags: result.value.preferenceTags.map(PreferenceTagPresenter.toHTTP),
    })
  }
}
