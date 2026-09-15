import type { FastifyReply } from 'fastify'
import { InstitutionMemberAlreadyExistsError } from '@/domain/institution/application/_errors/institution-member-already-exists-error'
import { InstitutionMembershipRequestNotFoundError } from '@/domain/institution/application/_errors/institution-membership-request-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { ApproveInstitutionMembershipRequestUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/approve-institution-membership-request'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'
import { InstitutionMembershipRequestPresenter } from '../../presenters/institution-membership-request-presenter'

interface ApproveInstitutionMembershipRequestParams {
  requestId: string
  actorId: string
}

export class ApproveInstitutionMembershipRequestController {
  constructor(private readonly approveInstitutionMembershipRequest: ApproveInstitutionMembershipRequestUseCase) {}

  async handle({ requestId, actorId }: ApproveInstitutionMembershipRequestParams, reply: FastifyReply) {
    const result = await this.approveInstitutionMembershipRequest.execute({
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

      if (error instanceof InstitutionMemberAlreadyExistsError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      request: InstitutionMembershipRequestPresenter.toHTTP(result.value.request),
      member: InstitutionMemberPresenter.toHTTP(result.value.member),
    })
  }
}
