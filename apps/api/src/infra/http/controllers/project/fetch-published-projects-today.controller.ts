import type { FastifyReply } from 'fastify'
import type { FetchPublishedProjectsTodayUseCase } from '@/domain/project/application/use-cases/fetch-published-projects-today'
import { ProjectPresenter } from '../../presenters/project-presenter'

export class FetchPublishedProjectsTodayController {
  constructor(private readonly fetchPublishedProjectsToday: FetchPublishedProjectsTodayUseCase) {}

  async handle(reply: FastifyReply) {
    const result = await this.fetchPublishedProjectsToday.execute()

    return reply.status(200).send({
      projects: result.value.projects.map(ProjectPresenter.toHTTP),
    })
  }
}
