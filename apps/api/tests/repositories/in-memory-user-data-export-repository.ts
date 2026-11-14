import type {
  ExportedProjectStar,
  ExportedPromotion,
  UserDataExportRepository,
} from '@/domain/identity/application/repositories/user-data-export-repository'

export class InMemoryUserDataExportRepository implements UserDataExportRepository {
  public projectStarsByUser = new Map<string, ExportedProjectStar[]>()
  public promotionsByUser = new Map<string, ExportedPromotion[]>()

  async findProjectStarsByUserId(userId: string): Promise<ExportedProjectStar[]> {
    return this.projectStarsByUser.get(userId) ?? []
  }

  async findPromotionsByUserId(userId: string): Promise<ExportedPromotion[]> {
    return this.promotionsByUser.get(userId) ?? []
  }
}
