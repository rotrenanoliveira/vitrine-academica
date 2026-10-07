import type { FastifyReply } from 'fastify'
import type { FetchMyInstitutionMembershipsUseCase } from '@/domain/institution/application/use-cases/institution-member/fetch-my-institution-memberships'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'

interface FetchMyInstitutionMembershipsParams {
  userId: string
}

export class FetchMyInstitutionMembershipsController {
  constructor(private readonly fetchMyInstitutionMemberships: FetchMyInstitutionMembershipsUseCase) {}

  async handle({ userId }: FetchMyInstitutionMembershipsParams, reply: FastifyReply) {
    const result = await this.fetchMyInstitutionMemberships.execute({ userId })

    return reply.status(200).send({
      members: result.value.members.map(InstitutionMemberPresenter.toHTTP),
    })
  }
}
