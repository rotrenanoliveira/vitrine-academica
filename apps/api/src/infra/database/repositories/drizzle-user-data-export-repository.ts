import { desc, eq } from 'drizzle-orm'
import type {
  ExportedProjectStar,
  ExportedPromotion,
  UserDataExportRepository,
} from '@/domain/identity/application/repositories/user-data-export-repository'
import type { DrizzleClient } from '../drizzle/client'
import { projectStars, promotions } from '../drizzle/schemas'

export class DrizzleUserDataExportRepository implements UserDataExportRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findProjectStarsByUserId(userId: string): Promise<ExportedProjectStar[]> {
    return this.db
      .select({
        id: projectStars.id,
        projectId: projectStars.projectId,
        weight: projectStars.weight,
        active: projectStars.active,
        ratedAt: projectStars.ratedAt,
        createdAt: projectStars.createdAt,
      })
      .from(projectStars)
      .where(eq(projectStars.userId, userId))
      .orderBy(desc(projectStars.ratedAt), desc(projectStars.id))
  }

  async findPromotionsByUserId(userId: string): Promise<ExportedPromotion[]> {
    return this.db
      .select({
        id: promotions.id,
        projectId: promotions.projectId,
        cost: promotions.cost,
        status: promotions.status,
        expiresAt: promotions.expiresAt,
        createdAt: promotions.createdAt,
      })
      .from(promotions)
      .where(eq(promotions.promoterId, userId))
      .orderBy(desc(promotions.createdAt), desc(promotions.id))
  }
}
