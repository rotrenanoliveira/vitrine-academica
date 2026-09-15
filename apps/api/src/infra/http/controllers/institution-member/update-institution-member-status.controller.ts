import type { FastifyReply } from 'fastify'
import { InstitutionMemberNotFoundError } from '@/domain/institution/application/_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { UpdateInstitutionMemberStatusUseCase } from '@/domain/institution/application/use-cases/institution-member/update-institution-member-status'
import type { InstitutionMemberStatus } from '@/domain/institution/enterprise/entities/institution-member'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'

interface UpdateInstitutionMemberStatusParams {
  memberId: string
  actorId: string
}

interface UpdateInstitutionMemberStatusBody {
  status: InstitutionMemberStatus
}

export class UpdateInstitutionMemberStatusController {
  constructor(private readonly updateInstitutionMemberStatus: UpdateInstitutionMemberStatusUseCase) {}

  async handle(
    { memberId, actorId }: UpdateInstitutionMemberStatusParams,
    { status }: UpdateInstitutionMemberStatusBody,
    reply: FastifyReply,
  ) {
    const result = await this.updateInstitutionMemberStatus.execute({
      memberId,
      actorId,
      status,
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
