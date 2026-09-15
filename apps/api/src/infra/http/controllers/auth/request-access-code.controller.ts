import type { FastifyReply } from 'fastify'
import { AccountNotFoundError } from '@/domain/identity/application/_errors/account-not-found-error'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import type { RequestAccessCodeUseCase } from '@/domain/identity/application/use-cases/auth/request-access-code'

interface RequestAccessCodeBody {
  email: string
}

export class RequestAccessCodeController {
  constructor(private readonly requestAccessCode: RequestAccessCodeUseCase) {}

  async handle({ email }: RequestAccessCodeBody, reply: FastifyReply) {
    const result = await this.requestAccessCode.execute({ email })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError || error instanceof AccountNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof UserUnavailableError) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(204).send(null)
  }
}
