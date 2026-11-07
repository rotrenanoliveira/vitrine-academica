import type { FastifyReply } from 'fastify'
import type { GetProjectsAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-projects-analytics'

interface GetProjectsAnalyticsParams {
  days: number
}

export class GetProjectsAnalyticsController {
  constructor(private readonly getProjectsAnalytics: GetProjectsAnalyticsUseCase) {}

  async handle({ days }: GetProjectsAnalyticsParams, reply: FastifyReply) {
    const result = await this.getProjectsAnalytics.execute({ days })

    return reply.status(200).send(result.value)
  }
}
