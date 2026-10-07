import type { FastifyReply } from 'fastify'
import type { FetchInstitutionsUseCase } from '@/domain/institution/application/use-cases/institution/fetch-institutions'
import { InstitutionPresenter } from '../../presenters/institution-presenter'

export class FetchInstitutionsController {
  constructor(private readonly fetchInstitutions: FetchInstitutionsUseCase) {}

  async handle(reply: FastifyReply) {
    const result = await this.fetchInstitutions.execute()

    return reply.status(200).send({
      institutions: result.value.institutions.map(InstitutionPresenter.toHTTP),
    })
  }
}
