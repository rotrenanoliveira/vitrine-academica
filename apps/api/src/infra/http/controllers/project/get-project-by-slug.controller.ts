import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { GetProjectBySlugUseCase } from '@/domain/project/application/use-cases/project/get-project-by-slug'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface GetProjectBySlugParams {
  slug: string
  requesterId?: string
}

export class GetProjectBySlugController {
  constructor(private readonly getProjectBySlug: GetProjectBySlugUseCase) {}

  async handle({ slug, requesterId }: GetProjectBySlugParams, reply: FastifyReply) {
    const result = await this.getProjectBySlug.execute({ slug, requesterId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      project: ProjectPresenter.toHTTP(result.value.project),
    })
  }
}
