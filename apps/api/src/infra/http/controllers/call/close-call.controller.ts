import type { FastifyReply } from 'fastify'
import { CallNotFoundError } from '@/domain/call/application/_errors/call-not-found-error'
import { InvalidCallStatusError } from '@/domain/call/application/_errors/invalid-call-status-error'
import { NotCallOwnerError } from '@/domain/call/application/_errors/not-call-owner-error'
import type { CloseCallUseCase } from '@/domain/call/application/use-cases/call/close-call'
import { CallPresenter } from '../../presenters/call-presenter'

interface CloseCallParams {
  callId: string
  authorId: string
}

export class CloseCallController {
  constructor(private readonly closeCall: CloseCallUseCase) {}

  async handle({ callId, authorId }: CloseCallParams, reply: FastifyReply) {
    const result = await this.closeCall.execute({ callId, authorId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof CallNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotCallOwnerError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      if (error instanceof InvalidCallStatusError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      call: CallPresenter.toHTTP(result.value.call),
    })
  }
}
