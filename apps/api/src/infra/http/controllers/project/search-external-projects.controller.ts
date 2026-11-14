import type { FastifyReply } from 'fastify'
import { ExternalServiceError } from '@/domain/project/application/_errors/external-service-error'
import type { SearchExternalProjectsUseCase } from '@/domain/project/application/use-cases/project/search-external-projects'

interface SearchExternalProjectsParams {
  query: string
  page: number
}

export class SearchExternalProjectsController {
  constructor(private searchExternalProjectsUseCase: SearchExternalProjectsUseCase) {}

  async handle({ query, page }: SearchExternalProjectsParams, reply: FastifyReply) {
    const result = await this.searchExternalProjectsUseCase.execute({ query, page })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ExternalServiceError) {
        return reply.status(502).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send(result.value)
  }
}
