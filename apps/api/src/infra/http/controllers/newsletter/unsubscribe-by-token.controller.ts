import type { FastifyReply } from 'fastify'
import type { UnsubscribeByTokenUseCase } from '@/domain/newsletter/application/use-cases/unsubscribe-by-token'

interface UnsubscribeByTokenBody {
  token: string
}

export class UnsubscribeByTokenController {
  constructor(private readonly unsubscribeByToken: UnsubscribeByTokenUseCase) {}

  async handle({ token }: UnsubscribeByTokenBody, reply: FastifyReply) {
    const result = await this.unsubscribeByToken.execute({ token })

    if (result.isLeft()) {
      return reply.status(404).send({ message: result.value.message })
    }

    return reply.status(200).send({ status: result.value.subscription.status })
  }
}
