import type { FastifyReply } from 'fastify'
import type { GetInstitutionsAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-institutions-analytics'

export class GetInstitutionsAnalyticsController {
  constructor(private readonly getInstitutionsAnalytics: GetInstitutionsAnalyticsUseCase) {}

  async handle(reply: FastifyReply) {
    const result = await this.getInstitutionsAnalytics.execute()

    return reply.status(200).send(result.value)
  }
}
