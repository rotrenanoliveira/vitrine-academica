import type { FastifyReply } from 'fastify'
import type { FetchMyCallApplicationsUseCase } from '@/domain/call/application/use-cases/call-application/fetch-my-call-applications'
import { CallApplicationPresenter } from '../../presenters/call-application-presenter'

interface FetchMyCallApplicationsParams {
  applicantId: string
}

export class FetchMyCallApplicationsController {
  constructor(private readonly fetchMyCallApplications: FetchMyCallApplicationsUseCase) {}

  async handle({ applicantId }: FetchMyCallApplicationsParams, reply: FastifyReply) {
    const result = await this.fetchMyCallApplications.execute({ applicantId })

    return reply.status(200).send({
      applications: result.value.applications.map(CallApplicationPresenter.toHTTPWithCall),
    })
  }
}
