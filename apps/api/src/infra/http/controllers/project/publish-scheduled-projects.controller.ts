import type { FastifyReply } from 'fastify'
import type { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { ProjectPresenter } from '../../presenters/project-presenter'

export class PublishScheduledProjectsController {
  constructor(private readonly publishScheduledProjects: PublishScheduledProjectsUseCase) {}

  async handle(reply: FastifyReply) {
    const result = await this.publishScheduledProjects.execute()

    if (!result.isRight()) {
      return reply.status(400).send({
        message: 'Não foi possível publicar os projetos agendados',
      })
    }

    return reply.status(200).send({
      projects: result.value.projects.map(ProjectPresenter.toHTTP),
    })
  }
}
