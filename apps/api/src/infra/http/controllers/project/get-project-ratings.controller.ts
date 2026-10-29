import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { GetProjectRatingsUseCase } from '@/domain/project/application/use-cases/project-star/get-project-ratings'
import { ProjectRatingPresenter } from '../../presenters/project-rating-presenter'

interface GetProjectRatingsParams {
  projectId: string
}

export class GetProjectRatingsController {
  constructor(private readonly getProjectRatings: GetProjectRatingsUseCase) {}

  async handle({ projectId }: GetProjectRatingsParams, reply: FastifyReply) {
    const result = await this.getProjectRatings.execute({ projectId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      rating: ProjectRatingPresenter.toHTTP(result.value.rating),
    })
  }
}
