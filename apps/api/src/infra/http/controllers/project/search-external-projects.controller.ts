import type { FastifyReply } from 'fastify'
import type { SearchExternalProjectsUseCase } from '@/domain/project/application/use-cases/project/search-external-projects'

interface SearchExternalProjectsParams {
  query: string
}

export class SearchExternalProjectsController {
  constructor(private searchExternalProjectsUseCase: SearchExternalProjectsUseCase) {}

  async handle({ query }: SearchExternalProjectsParams, reply: FastifyReply) {
    const result = await this.searchExternalProjectsUseCase.execute({ query })

    if (result.isLeft()) {
      throw result.value
    }

    return reply.status(200).send({ projects: result.value.projects })
  }
}
