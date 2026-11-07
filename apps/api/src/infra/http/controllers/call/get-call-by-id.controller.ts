import type { FastifyReply } from 'fastify'
import { CallNotFoundError } from '@/domain/call/application/_errors/call-not-found-error'
import type { GetCallByIdUseCase } from '@/domain/call/application/use-cases/call/get-call-by-id'
import { CallPresenter } from '../../presenters/call-presenter'

interface GetCallByIdParams {
  callId: string
}

export class GetCallByIdController {
  constructor(private readonly getCallById: GetCallByIdUseCase) {}

  async handle({ callId }: GetCallByIdParams, reply: FastifyReply) {
    const result = await this.getCallById.execute({ callId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof CallNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      call: CallPresenter.toHTTPWithSkills(result.value),
    })
  }
}
