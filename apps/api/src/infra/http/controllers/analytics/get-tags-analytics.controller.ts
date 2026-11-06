import type { FastifyReply } from 'fastify'
import type { GetTagsAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-tags-analytics'

interface GetTagsAnalyticsParams {
  limit: number
}

export class GetTagsAnalyticsController {
  constructor(private readonly getTagsAnalytics: GetTagsAnalyticsUseCase) {}

  async handle({ limit }: GetTagsAnalyticsParams, reply: FastifyReply) {
    const result = await this.getTagsAnalytics.execute({ limit })

    return reply.status(200).send(result.value)
  }
}
