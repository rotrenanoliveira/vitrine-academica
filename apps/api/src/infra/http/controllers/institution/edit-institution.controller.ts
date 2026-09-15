import type { FastifyReply } from 'fastify'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import { NotAllowedToManageInstitutionError } from '@/domain/institution/application/_errors/not-allowed-to-manage-institution-error'
import type { EditInstitutionUseCase } from '@/domain/institution/application/use-cases/institution/edit-institution'
import { InstitutionPresenter } from '../../presenters/institution-presenter'

interface EditInstitutionParams {
  institutionId: string
  actorId: string
}

interface EditInstitutionBody {
  name: string
  description: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

export class EditInstitutionController {
  constructor(private readonly editInstitution: EditInstitutionUseCase) {}

  async handle(
    { institutionId, actorId }: EditInstitutionParams,
    { name, description, shouldProof, shouldVerify, domain }: EditInstitutionBody,
    reply: FastifyReply,
  ) {
    const result = await this.editInstitution.execute({
      institutionId,
      actorId,
      name,
      description,
      shouldProof,
      shouldVerify,
      domain,
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
