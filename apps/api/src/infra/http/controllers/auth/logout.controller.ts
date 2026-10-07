import type { FastifyReply } from 'fastify'
import { SessionAlreadyRevokedError } from '@/domain/identity/application/_errors/session-already-revoked-error'
import { SessionNotFoundError } from '@/domain/identity/application/_errors/session-not-found-error'
import type { LogoutUseCase } from '@/domain/identity/application/use-cases/auth/logout'

interface LogoutParams {
  sessionId: string
}

export class LogoutController {
  constructor(private readonly logout: LogoutUseCase) {}

  async handle({ sessionId }: LogoutParams, reply: FastifyReply) {
    const result = await this.logout.execute({ sessionId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof SessionNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof SessionAlreadyRevokedError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(204).send(null)
  }
}
