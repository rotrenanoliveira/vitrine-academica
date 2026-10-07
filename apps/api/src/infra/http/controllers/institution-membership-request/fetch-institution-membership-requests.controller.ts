import type { FastifyReply } from 'fastify'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { FetchInstitutionMembershipRequestsUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/fetch-institution-membership-requests'
import { InstitutionMembershipRequestPresenter } from '../../presenters/institution-membership-request-presenter'

interface FetchInstitutionMembershipRequestsParams {
  institutionId: string
  actorId: string
}

export class FetchInstitutionMembershipRequestsController {
  constructor(private readonly fetchInstitutionMembershipRequests: FetchInstitutionMembershipRequestsUseCase) {}

  async handle({ institutionId, actorId }: FetchInstitutionMembershipRequestsParams, reply: FastifyReply) {
    const result = await this.fetchInstitutionMembershipRequests.execute({
      institutionId,
      actorId,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionNotFoundError) {
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
      requests: result.value.requests.map(InstitutionMembershipRequestPresenter.toHTTP),
    })
  }
}
