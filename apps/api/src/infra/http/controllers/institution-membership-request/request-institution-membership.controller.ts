import type { FastifyReply } from 'fastify'
import { InstitutionMemberAlreadyExistsError } from '@/domain/institution/application/_errors/institution-member-already-exists-error'
import { InstitutionMembershipRequestAlreadyExistsError } from '@/domain/institution/application/_errors/institution-membership-request-already-exists-error'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { MembershipProofRequiredError } from '@/domain/institution/application/_errors/membership-proof-required-error'
import type { RequestInstitutionMembershipUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/request-institution-membership'
import type { InstitutionMembershipRequestRole } from '@/domain/institution/enterprise/entities/institution-membership-request'
import { InstitutionMembershipRequestPresenter } from '../../presenters/institution-membership-request-presenter'

interface RequestInstitutionMembershipParams {
  institutionId: string
  userId: string
}

interface RequestInstitutionMembershipBody {
  role: InstitutionMembershipRequestRole
  proofAttachmentId?: string
}

export class RequestInstitutionMembershipController {
  constructor(private readonly requestInstitutionMembership: RequestInstitutionMembershipUseCase) {}

  async handle(
    { institutionId, userId }: RequestInstitutionMembershipParams,
    { role, proofAttachmentId }: RequestInstitutionMembershipBody,
    reply: FastifyReply,
  ) {
    const result = await this.requestInstitutionMembership.execute({
      institutionId,
      userId,
      role,
      proofAttachmentId,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof MembershipProofRequiredError) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      if (error instanceof InstitutionMemberAlreadyExistsError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      if (error instanceof InstitutionMembershipRequestAlreadyExistsError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      request: InstitutionMembershipRequestPresenter.toHTTP(result.value.request),
    })
  }
}
