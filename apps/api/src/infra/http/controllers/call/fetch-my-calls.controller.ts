import type { FastifyReply } from 'fastify'
import type { FetchMyCallsUseCase } from '@/domain/call/application/use-cases/call/fetch-my-calls'
import { CallPresenter } from '../../presenters/call-presenter'

interface FetchMyCallsParams {
  authorId: string
}

export class FetchMyCallsController {
  constructor(private readonly fetchMyCalls: FetchMyCallsUseCase) {}

  async handle({ authorId }: FetchMyCallsParams, reply: FastifyReply) {
    const result = await this.fetchMyCalls.execute({ authorId })

    return reply.status(200).send({
      calls: result.value.calls.map(CallPresenter.toHTTPWithSkills),
    })
  }
}
