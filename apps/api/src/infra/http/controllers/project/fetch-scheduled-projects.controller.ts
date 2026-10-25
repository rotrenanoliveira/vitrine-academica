import type { FastifyReply } from 'fastify'
import type { FetchScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/fetch-scheduled-projects'
import { FetchScheduledProjectPresenter } from '../../presenters/fetch-scheduled-project-presenter'

export class FetchScheduledProjectsController {
  constructor(private readonly fetchScheduledProjects: FetchScheduledProjectsUseCase) {}

  async handle(reply: FastifyReply) {
    const result = await this.fetchScheduledProjects.execute()

    return reply.status(200).send({
      scheduledProjects: result.value.scheduledProjects.map(FetchScheduledProjectPresenter.toHTTP),
    })
  }
}
