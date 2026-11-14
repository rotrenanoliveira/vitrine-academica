import type { ProjectStarCreditsRepository } from '@/domain/points/application/repositories/project-star-credits-repository'
import type { PointTransaction } from '@/domain/points/enterprise/entities/point-transaction'
import type { ProjectStar } from '@/domain/project/enterprise/entities/project-star'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzlePointTransactionMapper } from '../drizzle/mappers/drizzle-point-transaction-mapper'
import { DrizzleProjectStarMapper } from '../drizzle/mappers/drizzle-project-star-mapper'
import { pointTransactions, projectStars } from '../drizzle/schemas'

export class DrizzleProjectStarCreditsRepository implements ProjectStarCreditsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async createStarWithCredits(star: ProjectStar, credits: PointTransaction[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(projectStars).values(DrizzleProjectStarMapper.toPersistence(star))

      if (credits.length > 0) {
        await tx.insert(pointTransactions).values(credits.map(DrizzlePointTransactionMapper.toPersistence))
      }
    })
  }
}
