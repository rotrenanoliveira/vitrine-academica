import { type Either, right } from '@/core/either'
import type { PromotionsRepository } from '../../repositories/promotions-repository'

interface GetFeaturedProjectIdsUseCaseRequest {
  projectIds: string[]
  now?: Date
}

type GetFeaturedProjectIdsUseCaseResponse = Either<never, { featuredProjectIds: Set<string> }>

export class GetFeaturedProjectIdsUseCase {
  constructor(private readonly promotionsRepository: PromotionsRepository) {}

  async execute({
    projectIds,
    now = new Date(),
  }: GetFeaturedProjectIdsUseCaseRequest): Promise<GetFeaturedProjectIdsUseCaseResponse> {
    if (projectIds.length === 0) {
      return right({ featuredProjectIds: new Set<string>() })
    }

    const activeProjectIds = await this.promotionsRepository.findActiveProjectIds(projectIds, now)

    return right({ featuredProjectIds: new Set(activeProjectIds) })
  }
}
