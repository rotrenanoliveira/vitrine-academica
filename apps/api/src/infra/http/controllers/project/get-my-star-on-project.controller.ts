import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { GetMyStarOnProjectUseCase } from '@/domain/project/application/use-cases/project-star/get-my-star-on-project'
import { ProjectStarPresenter } from '../../presenters/project-star-presenter'

interface GetMyStarOnProjectParams {
  projectId: string
  userId: string
}

export class GetMyStarOnProjectController {
  constructor(private readonly getMyStarOnProject: GetMyStarOnProjectUseCase) {}

  async handle({ projectId, userId }: GetMyStarOnProjectParams, reply: FastifyReply) {
    const result = await this.getMyStarOnProject.execute({ projectId, userId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      star: result.value.star ? ProjectStarPresenter.toHTTP(result.value.star) : null,
    })
  }
}
