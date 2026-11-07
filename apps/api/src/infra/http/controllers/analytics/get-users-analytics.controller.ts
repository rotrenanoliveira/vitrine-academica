import type { FastifyReply } from 'fastify'
import type { GetUsersAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-users-analytics'

interface GetUsersAnalyticsParams {
  days: number
}

export class GetUsersAnalyticsController {
  constructor(private readonly getUsersAnalytics: GetUsersAnalyticsUseCase) {}

  async handle({ days }: GetUsersAnalyticsParams, reply: FastifyReply) {
    const result = await this.getUsersAnalytics.execute({ days })

    return reply.status(200).send(result.value)
  }
}
