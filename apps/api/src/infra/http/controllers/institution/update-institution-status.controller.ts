import type { FastifyReply } from 'fastify'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { UpdateInstitutionStatusUseCase } from '@/domain/institution/application/use-cases/institution/update-institution-status'
import type { InstitutionStatus } from '@/domain/institution/enterprise/entities/institutions'
import { InstitutionPresenter } from '../../presenters/institution-presenter'

interface UpdateInstitutionStatusParams {
  institutionId: string
  actorId: string
}

interface UpdateInstitutionStatusBody {
  status: InstitutionStatus
}

export class UpdateInstitutionStatusController {
  constructor(private readonly updateInstitutionStatus: UpdateInstitutionStatusUseCase) {}

  async handle(
    { institutionId, actorId }: UpdateInstitutionStatusParams,
    { status }: UpdateInstitutionStatusBody,
    reply: FastifyReply,
  ) {
    const result = await this.updateInstitutionStatus.execute({
      institutionId,
      actorId,
      status,
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
      institution: InstitutionPresenter.toHTTP(result.value.institution),
    })
  }
}
