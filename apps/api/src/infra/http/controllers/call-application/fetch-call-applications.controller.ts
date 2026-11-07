import type { FastifyReply } from 'fastify'
import { CallNotFoundError } from '@/domain/call/application/_errors/call-not-found-error'
import { NotCallOwnerError } from '@/domain/call/application/_errors/not-call-owner-error'
import type { FetchCallApplicationsUseCase } from '@/domain/call/application/use-cases/call-application/fetch-call-applications'
import type { CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import { CallApplicationPresenter } from '../../presenters/call-application-presenter'

interface FetchCallApplicationsParams {
  callId: string
  authorId: string
}

interface FetchCallApplicationsQuery {
  status?: CallApplicationStatus
}

export class FetchCallApplicationsController {
  constructor(private readonly fetchCallApplications: FetchCallApplicationsUseCase) {}

  async handle(
    { callId, authorId }: FetchCallApplicationsParams,
    { status }: FetchCallApplicationsQuery,
    reply: FastifyReply,
  ) {
    const result = await this.fetchCallApplications.execute({ callId, authorId, status })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof CallNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotCallOwnerError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      applications: result.value.applications.map(CallApplicationPresenter.toHTTPWithApplicant),
    })
  }
}
