import type { FastifyReply } from 'fastify'
import { AlreadyAppliedToCallError } from '@/domain/call/application/_errors/already-applied-to-call-error'
import { CallNotAcceptingApplicationsError } from '@/domain/call/application/_errors/call-not-accepting-applications-error'
import { CallNotFoundError } from '@/domain/call/application/_errors/call-not-found-error'
import { CannotApplyToOwnCallError } from '@/domain/call/application/_errors/cannot-apply-to-own-call-error'
import type { ApplyToCallUseCase } from '@/domain/call/application/use-cases/call-application/apply-to-call'
import { CallApplicationPresenter } from '../../presenters/call-application-presenter'

interface ApplyToCallParams {
  callId: string
  applicantId: string
}

interface ApplyToCallBody {
  message?: string | null
}

export class ApplyToCallController {
  constructor(private readonly applyToCall: ApplyToCallUseCase) {}

  async handle({ callId, applicantId }: ApplyToCallParams, { message }: ApplyToCallBody, reply: FastifyReply) {
    const result = await this.applyToCall.execute({ callId, applicantId, message })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof CallNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof CannotApplyToOwnCallError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      if (error instanceof CallNotAcceptingApplicationsError || error instanceof AlreadyAppliedToCallError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      application: CallApplicationPresenter.toHTTP(result.value.application),
    })
  }
}
