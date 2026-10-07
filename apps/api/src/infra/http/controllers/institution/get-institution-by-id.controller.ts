import type { FastifyReply } from 'fastify'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import type { GetInstitutionByIdUseCase } from '@/domain/institution/application/use-cases/institution/get-institution-by-id'
import { InstitutionPresenter } from '../../presenters/institution-presenter'

interface GetInstitutionByIdParams {
  institutionId: string
}

export class GetInstitutionByIdController {
  constructor(private readonly getInstitutionById: GetInstitutionByIdUseCase) {}

  async handle({ institutionId }: GetInstitutionByIdParams, reply: FastifyReply) {
    const result = await this.getInstitutionById.execute({ institutionId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof InstitutionNotFoundError) {
        return reply.status(404).send({
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
