import { type Action, defineAbilityFor, roleSchema } from '@vitrine-academica/permissions'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'

export function makeAuthorizeHandler(usersRepository: UsersRepository, action: Action, subject: 'Analytics') {
  return async function authorize(request: FastifyRequest, reply: FastifyReply) {
    const user = await usersRepository.findById(request.user.sub)

    if (!user) {
      return reply.status(401).send({
        message: 'Não autenticado.',
      })
    }

    const ability = defineAbilityFor({
      id: user.id.toString(),
      role: roleSchema.parse(user.role),
    })

    if (ability.cannot(action, subject)) {
      return reply.status(403).send({
        message: 'Acesso negado.',
      })
    }
  }
}
