import type { FastifyReply } from 'fastify'
import { InstitutionMemberAlreadyExistsError } from '@/domain/institution/application/_errors/institution-member-already-exists-error'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { CreateInstitutionMemberUseCase } from '@/domain/institution/application/use-cases/institution-member/create-institution-member'
import type { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { InstitutionMemberPresenter } from '../../presenters/institution-member-presenter'

interface CreateInstitutionMemberParams {
  institutionId: string
  actorId: string
}

interface CreateInstitutionMemberBody {
  userId: string
  role: InstitutionMemberRole
}

export class CreateInstitutionMemberController {
  constructor(private readonly createInstitutionMember: CreateInstitutionMemberUseCase) {}

  async handle(
    { institutionId, actorId }: CreateInstitutionMemberParams,
    { userId, role }: CreateInstitutionMemberBody,
    reply: FastifyReply,
  ) {
    const result = await this.createInstitutionMember.execute({
      institutionId,
      actorId,
      userId,
      role,
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

      if (error instanceof InstitutionMemberAlreadyExistsError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      member: InstitutionMemberPresenter.toHTTP(result.value.member),
    })
  }
}
