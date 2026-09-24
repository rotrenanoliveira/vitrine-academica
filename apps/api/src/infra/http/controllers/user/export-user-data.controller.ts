import type { FastifyReply, FastifyRequest } from 'fastify'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { ExportUserDataUseCase } from '@/domain/identity/application/use-cases/user/export-user-data'

export class ExportUserDataController {
  constructor(private readonly exportUserDataUseCase: ExportUserDataUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub

    const result = await this.exportUserDataUseCase.execute({ userId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof UserNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      return reply.status(400).send({ message: 'Erro ao exportar dados.' })
    }

    return reply.status(200).send(result.value.userData)
  }
}
