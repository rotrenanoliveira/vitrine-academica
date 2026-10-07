import type { FastifyReply } from 'fastify'
import { InstitutionMembershipRequestNotFoundError } from '@/domain/institution/application/_errors/institution-membership-request-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { RejectInstitutionMembershipRequestUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/reject-institution-membership-request'
import { InstitutionMembershipRequestPresenter } from '../../presenters/institution-membership-request-presenter'

interface RejectInstitutionMembershipRequestParams {
  requestId: string
  actorId: string
}

export class RejectInstitutionMembershipRequestController {
  constructor(private readonly rejectInstitutionMembershipRequest: RejectInstitutionMembershipRequestUseCase) {}

  async handle({ requestId, actorId }: RejectInstitutionMembershipRequestParams, reply: FastifyReply) {
    const result = await this.rejectInstitutionMembershipRequest.execute({
      requestId,
      actorId,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionMembershipRequestNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotAllowedToManageInstitutionError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      request: InstitutionMembershipRequestPresenter.toHTTP(result.value.request),
    })
  }
}
