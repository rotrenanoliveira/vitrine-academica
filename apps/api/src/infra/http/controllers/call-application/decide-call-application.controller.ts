import type { FastifyReply } from 'fastify'
import { CallApplicationNotFoundError } from '@/domain/call/application/_errors/call-application-not-found-error'
import { CallNotFoundError } from '@/domain/call/application/_errors/call-not-found-error'
import { InvalidCallApplicationStatusError } from '@/domain/call/application/_errors/invalid-call-application-status-error'
import { NotCallOwnerError } from '@/domain/call/application/_errors/not-call-owner-error'
import type { DecideCallApplicationUseCase } from '@/domain/call/application/use-cases/call-application/decide-call-application'
import { CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import { CallApplicationPresenter } from '../../presenters/call-application-presenter'

interface DecideCallApplicationParams {
  callId: string
  applicationId: string
  authorId: string
}

interface DecideCallApplicationBody {
  decision: 'APPROVED' | 'REJECTED'
}

export class DecideCallApplicationController {
  constructor(private readonly decideCallApplication: DecideCallApplicationUseCase) {}

  async handle(
    { callId, applicationId, authorId }: DecideCallApplicationParams,
    { decision }: DecideCallApplicationBody,
    reply: FastifyReply,
  ) {
    const result = await this.decideCallApplication.execute({
      callId,
      applicationId,
      authorId,
      decision: decision === 'APPROVED' ? CallApplicationStatus.APPROVED : CallApplicationStatus.REJECTED,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof CallNotFoundError || error instanceof CallApplicationNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotCallOwnerError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      if (error instanceof InvalidCallApplicationStatusError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      application: CallApplicationPresenter.toHTTP(result.value.application),
      notified: result.value.notified,
    })
  }
}
