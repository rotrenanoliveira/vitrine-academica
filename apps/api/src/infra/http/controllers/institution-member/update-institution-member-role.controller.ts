import type { FastifyReply } from 'fastify'
import { CannotRemoveLastInstitutionManagerError } from '@/domain/institution/application/_errors/cannot-remove-last-institution-manager-error'
import { InstitutionMemberNotFoundError } from '@/domain/institution/application/_errors/institution-member-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { UpdateInstitutionMemberRoleUseCase } from '@/domain/institution/application/use-cases/institution-member/update-institution-member-role'
import type { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'

interface UpdateInstitutionMemberRoleParams {
  memberId: string
  actorId: string
}

interface UpdateInstitutionMemberRoleBody {
  role: InstitutionMemberRole
}

export class UpdateInstitutionMemberRoleController {
  constructor(private readonly updateInstitutionMemberRole: UpdateInstitutionMemberRoleUseCase) {}

  async handle(
    { memberId, actorId }: UpdateInstitutionMemberRoleParams,
    { role }: UpdateInstitutionMemberRoleBody,
    reply: FastifyReply,
  ) {
    const result = await this.updateInstitutionMemberRole.execute({
      memberId,
      actorId,
      role,
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

      if (error instanceof CannotRemoveLastInstitutionManagerError) {
        return reply.status(409).send({
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
