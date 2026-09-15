import type { FastifyReply } from 'fastify'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { FetchInstitutionMembersUseCase } from '@/domain/institution/application/use-cases/institution-member/fetch-institution-members'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'

interface FetchInstitutionMembersParams {
  institutionId: string
  actorId: string
}

export class FetchInstitutionMembersController {
  constructor(private readonly fetchInstitutionMembers: FetchInstitutionMembersUseCase) {}

  async handle({ institutionId, actorId }: FetchInstitutionMembersParams, reply: FastifyReply) {
    const result = await this.fetchInstitutionMembers.execute({
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
      members: result.value.members.map(InstitutionMemberPresenter.toHTTP),
    })
  }
}
