import type { FastifyReply } from 'fastify'
import type { FetchProjectsOfInterestUseCase } from '@/domain/project/application/use-cases/project-tag/fetch-projects-of-interest'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface FetchProjectsOfInterestParams {
  userId: string
}

export class FetchProjectsOfInterestController {
  constructor(private readonly fetchProjectsOfInterest: FetchProjectsOfInterestUseCase) {}

  async handle({ userId }: FetchProjectsOfInterestParams, reply: FastifyReply) {
    const result = await this.fetchProjectsOfInterest.execute({ userId })

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
