export interface ExportedProjectStar {
  id: string
  projectId: string
  weight: number
  active: boolean
  ratedAt: Date
  createdAt: Date
}

export interface ExportedPromotion {
  id: string
  projectId: string
  cost: number
  status: string
  expiresAt: Date
  createdAt: Date
}

export interface UserDataExportRepository {
  findProjectStarsByUserId(userId: string): Promise<ExportedProjectStar[]>

  findPromotionsByUserId(userId: string): Promise<ExportedPromotion[]>
}
