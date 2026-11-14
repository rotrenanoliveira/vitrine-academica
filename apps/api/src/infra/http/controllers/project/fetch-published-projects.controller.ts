import type { FastifyReply } from 'fastify'
import type { GetFeaturedProjectIdsUseCase } from '@/domain/points/application/use-cases/promotion/get-featured-project-ids'
import type { FetchPublishedProjectsUseCase } from '@/domain/project/application/use-cases/fetch-published-projects'
import { ProjectWithFeaturedPresenter } from '../../presenters/project-with-featured-presenter'

export class FetchPublishedProjectsController {
  constructor(
    private readonly fetchPublishedProjects: FetchPublishedProjectsUseCase,
    private readonly getFeaturedProjectIds: GetFeaturedProjectIdsUseCase,
  ) {}

  async handle(reply: FastifyReply) {
    const result = await this.fetchPublishedProjects.execute()

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
