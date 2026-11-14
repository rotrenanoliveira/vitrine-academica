import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import { makeAuthenticateHandler } from './authenticate'

export function makeOptionalAuthenticateHandler(sessionsRepository: SessionsRepository) {
  const authenticate = makeAuthenticateHandler(sessionsRepository)

  return async function optionalAuthenticate(request: FastifyRequest, reply: FastifyReply) {
    if (!request.headers.authorization) {
      return
    }

    return authenticate(request, reply)
  }
}
