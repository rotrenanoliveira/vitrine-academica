import type { FastifyReply } from 'fastify'
import type { GetFeaturedProjectIdsUseCase } from '@/domain/points/application/use-cases/promotion/get-featured-project-ids'
import type { FetchProjectsOfInterestUseCase } from '@/domain/project/application/use-cases/project-tag/fetch-projects-of-interest'
import { ProjectWithFeaturedPresenter } from '../../presenters/project-with-featured-presenter'

interface FetchProjectsOfInterestParams {
  userId: string
}

export class FetchProjectsOfInterestController {
  constructor(
    private readonly fetchProjectsOfInterest: FetchProjectsOfInterestUseCase,
    private readonly getFeaturedProjectIds: GetFeaturedProjectIdsUseCase,
  ) {}

  async handle({ userId }: FetchProjectsOfInterestParams, reply: FastifyReply) {
    const result = await this.fetchProjectsOfInterest.execute({ userId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    const { projects } = result.value
    const featured = await this.getFeaturedProjectIds.execute({
      projectIds: projects.map((project) => project.id.toString()),
    })

    return reply.status(200).send({
      projects: projects.map((project) =>
        ProjectWithFeaturedPresenter.toHTTP(project, featured.value.featuredProjectIds.has(project.id.toString())),
      ),
    })
  }
}
