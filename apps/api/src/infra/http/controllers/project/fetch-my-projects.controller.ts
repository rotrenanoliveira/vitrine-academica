import type { FastifyReply } from 'fastify'
import type { FetchMyProjectsUseCase } from '@/domain/project/application/use-cases/project/fetch-my-projects'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface FetchMyProjectsQuery {
  authorId: string
  status?: string
}

export class FetchMyProjectsController {
  constructor(private readonly fetchMyProjects: FetchMyProjectsUseCase) {}

  async handle({ authorId, status }: FetchMyProjectsQuery, reply: FastifyReply) {
    const result = await this.fetchMyProjects.execute({ authorId, status })

    return reply.status(200).send({
      projects: result.value.projects.map(ProjectPresenter.toHTTP),
    })
  }
}
