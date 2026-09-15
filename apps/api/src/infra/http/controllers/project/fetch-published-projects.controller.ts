import type { FastifyReply } from 'fastify'
import type { FetchPublishedProjectsUseCase } from '@/domain/project/application/use-cases/fetch-published-projects'
import { ProjectPresenter } from '../../presenters/project-presenter'

export class FetchPublishedProjectsController {
  constructor(private readonly fetchPublishedProjects: FetchPublishedProjectsUseCase) {}

  async handle(reply: FastifyReply) {
    const result = await this.fetchPublishedProjects.execute()

    return reply.status(200).send({
      projects: result.value.projects.map(ProjectPresenter.toHTTP),
    })
  }
}
