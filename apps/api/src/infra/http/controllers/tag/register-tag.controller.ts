import type { FastifyReply } from 'fastify'
import type { RegisterTagUseCase } from '@/domain/tag/application/use-cases/tag/register-tag'
import { TagPresenter } from '../../presenters/tag-presenter'

interface RegisterTagBody {
  name: string
}

export class RegisterTagController {
  constructor(private readonly registerTag: RegisterTagUseCase) {}

  async handle({ name }: RegisterTagBody, reply: FastifyReply) {
    const result = await this.registerTag.execute({ name })

    if (result.isLeft()) {
      return reply.status(400).send({
        message: result.value.message,
      })
    }

    return reply.status(201).send({
      tag: TagPresenter.toHTTP(result.value.tag),
    })
  }
}
