import type { FastifyReply } from 'fastify'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { FindUserByIdUseCase } from '@/domain/identity/application/use-cases/user/find-user-by-id'
import { UserPresenter } from '../../presenters/user-presenter'

interface Body {
  userId: string
}

export class FindUserByIdController {
  constructor(private readonly findUserById: FindUserByIdUseCase) {}

  async handle({ userId }: Body, reply: FastifyReply) {
    const result = await this.findUserById.execute({ userId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    return reply.status(200).send({
      user: UserPresenter.toHTTP(result.value.user, new UniqueEntityId(result.value.accountId)),
    })
  }
}
