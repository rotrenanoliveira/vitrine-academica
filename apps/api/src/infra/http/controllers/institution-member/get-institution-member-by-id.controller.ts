import type { FastifyReply } from 'fastify'
import { InstitutionMemberNotFoundError } from '@/domain/institution/application/_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { GetInstitutionMemberByIdUseCase } from '@/domain/institution/application/use-cases/institution-member/get-institution-member-by-id'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'

interface GetInstitutionMemberByIdParams {
  memberId: string
  actorId: string
}

export class GetInstitutionMemberByIdController {
  constructor(private readonly getInstitutionMemberById: GetInstitutionMemberByIdUseCase) {}

  async handle({ memberId, actorId }: GetInstitutionMemberByIdParams, reply: FastifyReply) {
    const result = await this.getInstitutionMemberById.execute({
      memberId,
      actorId,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionMemberNotFoundError) {
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
      member: InstitutionMemberPresenter.toHTTP(result.value.member),
    })
  }
}
