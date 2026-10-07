import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'

export function makeAuthenticateHandler(sessionsRepository: SessionsRepository) {
  return async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({
        message: 'Não autenticado.',
      })
    }

    const sessionId = request.user.jti

    if (!sessionId) {
      return reply.status(401).send({
        message: 'Não autenticado.',
      })
    }

    const session = await sessionsRepository.findById(sessionId)

    if (!session) {
      return reply.status(401).send({
        message: 'Não autenticado.',
      })
    }

    if (!session.isActive()) {
      return reply.status(401).send({
        message: 'Sessão expirada.',
      })
    }
  }
}
