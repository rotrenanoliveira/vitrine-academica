import { and, desc, eq, sql } from 'drizzle-orm'
import type { ProjectStarsRepository } from '@/domain/project/application/repositories/project-stars-repository'
import type { ProjectStar } from '@/domain/project/enterprise/entities/project-star'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectStarMapper } from '../drizzle/mappers/drizzle-project-star-mapper'
import { projectStars } from '../drizzle/schemas'

export class DrizzleProjectStarsRepository implements ProjectStarsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<ProjectStar | null> {
    const [row] = await this.db.select().from(projectStars).where(eq(projectStars.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectStarMapper.toDomain(row)
  }

  async findByProjectAndUser(projectId: string, userId: string): Promise<ProjectStar | null> {
    const [row] = await this.db
      .select()
      .from(projectStars)
      .where(and(eq(projectStars.projectId, projectId), eq(projectStars.userId, userId)))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectStarMapper.toDomain(row)
  }

  async findActiveByProjectAndUser(projectId: string, userId: string): Promise<ProjectStar | null> {
    const [row] = await this.db
      .select()
      .from(projectStars)
      .where(and(eq(projectStars.projectId, projectId), eq(projectStars.userId, userId), eq(projectStars.active, true)))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectStarMapper.toDomain(row)
  }

  async findManyActiveByUserId(userId: string): Promise<ProjectStar[]> {
    const rows = await this.db
      .select()
      .from(projectStars)
      .where(and(eq(projectStars.userId, userId), eq(projectStars.active, true)))
      .orderBy(desc(projectStars.ratedAt))

    return rows.map(DrizzleProjectStarMapper.toDomain)
  }

  async countActiveByProjectId(projectId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectStars)
      .where(and(eq(projectStars.projectId, projectId), eq(projectStars.active, true)))

    return row?.count ?? 0
  }

  async sumWeightByProjectId(projectId: string): Promise<number> {
    const [row] = await this.db
      .select({ sum: sql<number>`coalesce(sum(${projectStars.weight}), 0)::int` })
      .from(projectStars)
      .where(and(eq(projectStars.projectId, projectId), eq(projectStars.active, true)))

    return row?.sum ?? 0
  }

  async create(star: ProjectStar): Promise<void> {
    await this.db.insert(projectStars).values(DrizzleProjectStarMapper.toPersistence(star))
  }

  async save(star: ProjectStar): Promise<void> {
    await this.db
      .update(projectStars)
      .set(DrizzleProjectStarMapper.toPersistence(star))
      .where(eq(projectStars.id, star.id.toString()))
  }
}
