import type { ProjectStar } from '@/domain/project/enterprise/entities/project-star'
import type { PointTransaction } from '../../enterprise/entities/point-transaction'

export interface ProjectStarCreditsRepository {
  createStarWithCredits(star: ProjectStar, credits: PointTransaction[]): Promise<void>
}
