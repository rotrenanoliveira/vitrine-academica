import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { ProjectTeacherRatingsRepository } from '@/domain/project/application/repositories/project-teacher-ratings-repository'
import type { ProjectRatingCriterionAverage } from '@/domain/project/enterprise/entities/project-rating'
import type { ProjectTeacherRating } from '@/domain/project/enterprise/entities/project-teacher-rating'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectTeacherRatingMapper } from '../drizzle/mappers/drizzle-project-teacher-rating-mapper'
import { projectTeacherRatings, ratingCriteria, teacherRatingItems } from '../drizzle/schemas'

export class DrizzleProjectTeacherRatingsRepository implements ProjectTeacherRatingsRepository {
  constructor(private readonly db: DrizzleClient) {}

  private async loadItemsByRatingIds(ratingIds: string[]) {
    if (ratingIds.length === 0) {
      return new Map<string, (typeof teacherRatingItems.$inferSelect)[]>()
    }

    const rows = await this.db.select().from(teacherRatingItems).where(inArray(teacherRatingItems.ratingId, ratingIds))

    const map = new Map<string, (typeof teacherRatingItems.$inferSelect)[]>()

    for (const row of rows) {
      const list = map.get(row.ratingId) ?? []
      list.push(row)
      map.set(row.ratingId, list)
    }

    return map
  }

  async findById(id: string): Promise<ProjectTeacherRating | null> {
    const [row] = await this.db.select().from(projectTeacherRatings).where(eq(projectTeacherRatings.id, id)).limit(1)

    if (!row) {
      return null
    }

    const itemsMap = await this.loadItemsByRatingIds([row.id])
    return DrizzleProjectTeacherRatingMapper.toDomain(row, itemsMap.get(row.id) ?? [])
  }

  async findByProjectAndTeacher(projectId: string, teacherId: string): Promise<ProjectTeacherRating | null> {
    const [row] = await this.db
      .select()
      .from(projectTeacherRatings)
      .where(and(eq(projectTeacherRatings.projectId, projectId), eq(projectTeacherRatings.teacherId, teacherId)))
      .limit(1)

    if (!row) {
      return null
    }

    const itemsMap = await this.loadItemsByRatingIds([row.id])
    return DrizzleProjectTeacherRatingMapper.toDomain(row, itemsMap.get(row.id) ?? [])
  }

  async findManyByTeacherId(teacherId: string): Promise<ProjectTeacherRating[]> {
    const rows = await this.db
      .select()
      .from(projectTeacherRatings)
      .where(eq(projectTeacherRatings.teacherId, teacherId))
      .orderBy(desc(projectTeacherRatings.ratedAt))

    const itemsMap = await this.loadItemsByRatingIds(rows.map((row) => row.id))

    return rows.map((row) => DrizzleProjectTeacherRatingMapper.toDomain(row, itemsMap.get(row.id) ?? []))
  }

  async findManyByProjectId(projectId: string): Promise<ProjectTeacherRating[]> {
    const rows = await this.db
      .select()
      .from(projectTeacherRatings)
      .where(eq(projectTeacherRatings.projectId, projectId))

    const itemsMap = await this.loadItemsByRatingIds(rows.map((row) => row.id))

    return rows.map((row) => DrizzleProjectTeacherRatingMapper.toDomain(row, itemsMap.get(row.id) ?? []))
  }

  async countByProjectId(projectId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectTeacherRatings)
      .where(eq(projectTeacherRatings.projectId, projectId))

    return row?.count ?? 0
  }

  async averageOverallByProjectId(projectId: string): Promise<number | null> {
    const [row] = await this.db
      .select({
        average: sql<number | null>`round(avg(${projectTeacherRatings.overallScore})::numeric, 1)::float`,
      })
      .from(projectTeacherRatings)
      .where(eq(projectTeacherRatings.projectId, projectId))

    return row?.average ?? null
  }

  async averagesByCriterionForProject(projectId: string): Promise<ProjectRatingCriterionAverage[]> {
    const rows = await this.db
      .select({
        criterionId: teacherRatingItems.criterionId,
        criterionName: ratingCriteria.name,
        average: sql<number>`round(avg(${teacherRatingItems.score})::numeric, 1)::float`,
      })
      .from(teacherRatingItems)
      .innerJoin(projectTeacherRatings, eq(teacherRatingItems.ratingId, projectTeacherRatings.id))
      .innerJoin(ratingCriteria, eq(teacherRatingItems.criterionId, ratingCriteria.id))
      .where(eq(projectTeacherRatings.projectId, projectId))
      .groupBy(teacherRatingItems.criterionId, ratingCriteria.name)

    return rows.map((row) => ({
      criterionId: row.criterionId,
      criterionName: row.criterionName,
      average: row.average,
    }))
  }

  async create(teacherRating: ProjectTeacherRating): Promise<void> {
    await this.db.insert(projectTeacherRatings).values(DrizzleProjectTeacherRatingMapper.toPersistence(teacherRating))

    const items = DrizzleProjectTeacherRatingMapper.itemsToPersistence(teacherRating)

    if (items.length > 0) {
      await this.db.insert(teacherRatingItems).values(items)
    }
  }

  async save(teacherRating: ProjectTeacherRating): Promise<void> {
    await this.db
      .update(projectTeacherRatings)
      .set(DrizzleProjectTeacherRatingMapper.toPersistence(teacherRating))
      .where(eq(projectTeacherRatings.id, teacherRating.id.toString()))

    await this.db.delete(teacherRatingItems).where(eq(teacherRatingItems.ratingId, teacherRating.id.toString()))

    const items = DrizzleProjectTeacherRatingMapper.itemsToPersistence(teacherRating)

    if (items.length > 0) {
      await this.db.insert(teacherRatingItems).values(items)
    }
  }
}
