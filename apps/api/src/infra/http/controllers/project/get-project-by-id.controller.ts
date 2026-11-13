import type { FastifyReply } from 'fastify'
import type { GetFeaturedProjectIdsUseCase } from '@/domain/points/application/use-cases/promotion/get-featured-project-ids'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { GetProjectByIdUseCase } from '@/domain/project/application/use-cases/project/get-project-by-id'
import { ProjectWithFeaturedPresenter } from '../../presenters/project-with-featured-presenter'

interface GetProjectByIdParams {
  projectId: string
  requesterId: string
}

export class GetProjectByIdController {
  constructor(
    private readonly getProjectById: GetProjectByIdUseCase,
    private readonly getFeaturedProjectIds: GetFeaturedProjectIdsUseCase,
  ) {}

  async handle({ projectId, requesterId }: GetProjectByIdParams, reply: FastifyReply) {
    const result = await this.getProjectById.execute({ projectId, requesterId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      throw error
    }

    const { project } = result.value
    const featured = await this.getFeaturedProjectIds.execute({ projectIds: [project.id.toString()] })

    return reply.status(200).send({
      project: ProjectWithFeaturedPresenter.toHTTP(
        project,
        featured.value.featuredProjectIds.has(project.id.toString()),
      ),
    })
  }
}
