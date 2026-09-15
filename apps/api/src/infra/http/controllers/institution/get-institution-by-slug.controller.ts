import type { FastifyReply } from 'fastify'
import { InstitutionNotFoundError } from '@/domain/institution/application/_errors/institution-not-found-error'
import type { GetInstitutionBySlugUseCase } from '@/domain/institution/application/use-cases/institution/get-institution-by-slug'
import { InstitutionPresenter } from '../../presenters/institution-presenter'

interface GetInstitutionBySlugParams {
  slug: string
}

export class GetInstitutionBySlugController {
  constructor(private readonly getInstitutionBySlug: GetInstitutionBySlugUseCase) {}

  async handle({ slug }: GetInstitutionBySlugParams, reply: FastifyReply) {
    const result = await this.getInstitutionBySlug.execute({ slug })

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
