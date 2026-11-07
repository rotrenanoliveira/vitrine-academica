import type { FastifyReply } from 'fastify'
import type { FetchCallsUseCase } from '@/domain/call/application/use-cases/call/fetch-calls'
import { CallPresenter } from '../../presenters/call-presenter'

interface FetchCallsQuery {
  tagId?: string
}

export class FetchCallsController {
  constructor(private readonly fetchCalls: FetchCallsUseCase) {}

  async handle({ tagId }: FetchCallsQuery, reply: FastifyReply) {
    const result = await this.fetchCalls.execute({ tagId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    return reply.status(200).send({
      calls: result.value.calls.map(CallPresenter.toHTTPWithSkills),
    })
  }
}
