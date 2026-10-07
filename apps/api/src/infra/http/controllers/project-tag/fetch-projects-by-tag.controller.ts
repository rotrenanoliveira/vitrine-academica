import type { FastifyReply } from 'fastify'
import type { FetchProjectsByTagUseCase } from '@/domain/project/application/use-cases/project-tag/fetch-projects-by-tag'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface FetchProjectsByTagParams {
  tagId: string
}

export class FetchProjectsByTagController {
  constructor(private readonly fetchProjectsByTag: FetchProjectsByTagUseCase) {}

  async handle({ tagId }: FetchProjectsByTagParams, reply: FastifyReply) {
    const result = await this.fetchProjectsByTag.execute({ tagId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    return reply.status(200).send({
      projects: result.value.projects.map(ProjectPresenter.toHTTP),
    })
  }
}
