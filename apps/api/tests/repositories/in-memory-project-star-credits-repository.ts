import type { ProjectStarCreditsRepository } from '@/domain/points/application/repositories/project-star-credits-repository'
import type { PointTransaction } from '@/domain/points/enterprise/entities/point-transaction'
import type { ProjectStar } from '@/domain/project/enterprise/entities/project-star'
import type { InMemoryPointTransactionsRepository } from './in-memory-point-transactions-repository'
import type { InMemoryProjectStarsRepository } from './in-memory-project-stars-repository'

export class InMemoryProjectStarCreditsRepository implements ProjectStarCreditsRepository {
  constructor(
    private readonly projectStarsRepository: InMemoryProjectStarsRepository,
    private readonly pointTransactionsRepository: InMemoryPointTransactionsRepository,
  ) {}

  async createStarWithCredits(star: ProjectStar, credits: PointTransaction[]): Promise<void> {
    await this.projectStarsRepository.create(star)

    for (const credit of credits) {
      await this.pointTransactionsRepository.create(credit)
    }
  }
}
