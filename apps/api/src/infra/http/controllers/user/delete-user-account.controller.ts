import type { FastifyReply, FastifyRequest } from 'fastify'
import { SoleInstitutionManagerError } from '@/domain/identity/application/_errors/sole-institution-manager-error'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { DeleteUserAccountUseCase } from '@/domain/identity/application/use-cases/user/delete-user-account'

export class DeleteUserAccountController {
  constructor(private readonly deleteUserAccountUseCase: DeleteUserAccountUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub

    const result = await this.deleteUserAccountUseCase.execute({ userId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof SoleInstitutionManagerError) {
        return reply.status(409).send({
          message: error.message,
          institutions: error.institutions,
        })
      }

      return reply.status(400).send({ message: 'Erro ao excluir a conta.' })
    }

    return reply.status(200).send(result.value)
  }
}
