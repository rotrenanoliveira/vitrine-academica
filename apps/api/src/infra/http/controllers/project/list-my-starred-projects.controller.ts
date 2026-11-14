import type { FastifyReply } from 'fastify'
import type { ListMyStarredProjectsUseCase } from '@/domain/project/application/use-cases/project-star/list-my-starred-projects'
import { ProjectPresenter } from '../../presenters/project-presenter'
import { ProjectStarPresenter } from '../../presenters/project-star-presenter'

interface ListMyStarredProjectsParams {
  userId: string
}

export class ListMyStarredProjectsController {
  constructor(private readonly listMyStarredProjects: ListMyStarredProjectsUseCase) {}

  async handle({ userId }: ListMyStarredProjectsParams, reply: FastifyReply) {
    const result = await this.listMyStarredProjects.execute({ userId })

    return reply.status(200).send({
      items: result.value.items.map((item) => ({
        project: ProjectPresenter.toHTTP(item.project),
        star: ProjectStarPresenter.toHTTP(item.star),
      })),
    })
  }
}
