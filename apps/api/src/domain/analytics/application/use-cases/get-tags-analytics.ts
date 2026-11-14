import { type Either, right } from '@/core/either'
import type { AnalyticsRepository, TagUsage } from '../repositories/analytics-repository'

interface GetTagsAnalyticsUseCaseRequest {
  limit: number
}

type GetTagsAnalyticsUseCaseResponse = Either<never, { tags: TagUsage[] }>

export class GetTagsAnalyticsUseCase {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute({ limit }: GetTagsAnalyticsUseCaseRequest): Promise<GetTagsAnalyticsUseCaseResponse> {
    const tags = await this.analyticsRepository.findMostUsedTags(limit)

    return right({ tags })
  }
}
