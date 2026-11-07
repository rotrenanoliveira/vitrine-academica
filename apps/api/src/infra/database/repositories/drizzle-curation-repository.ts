import { and, count, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import type {
  CommunityCurationEntry,
  CurationFilters,
  CurationRepository,
  TeacherCurationEntry,
} from '@/domain/curation/application/repositories/curation-repository'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectMapper } from '../drizzle/mappers/drizzle-project-mapper'
import { institutionMembers } from '../drizzle/schemas/institution-members'
import { projectStars } from '../drizzle/schemas/project-stars'
import { projectTeacherRatings } from '../drizzle/schemas/project-teacher-ratings'
import { projects } from '../drizzle/schemas/projects'

export class DrizzleCurationRepository implements CurationRepository {
  constructor(private readonly db: DrizzleClient) {}

  private projectConditions({ since, institutionId }: CurationFilters) {
    const conditions = [eq(projects.status, 'PUBLISHED'), gte(projects.createdAt, since)]

    if (institutionId) {
      const institutionAuthors = this.db
        .select({ userId: institutionMembers.userId })
        .from(institutionMembers)
        .where(and(eq(institutionMembers.institutionId, institutionId), eq(institutionMembers.status, 'ACTIVE')))

      conditions.push(inArray(projects.authorId, institutionAuthors))
    }

    return conditions
  }

  async findTopByTeachers(filters: CurationFilters): Promise<TeacherCurationEntry[]> {
    const teacherAverage = sql<number>`avg(${projectTeacherRatings.overallScore})`.mapWith(Number)
    const teacherRatingsCount = count(projectTeacherRatings.id)

    const rows = await this.db
      .select({ project: projects, teacherAverage, teacherRatingsCount })
      .from(projectTeacherRatings)
      .innerJoin(projects, eq(projectTeacherRatings.projectId, projects.id))
      .where(and(...this.projectConditions(filters)))
      .groupBy(projects.id)
      .orderBy(desc(teacherAverage), desc(teacherRatingsCount), desc(projects.createdAt))
      .limit(filters.limit)

    return rows.map((row) => ({
      project: DrizzleProjectMapper.toDomain(row.project),
      teacherAverage: row.teacherAverage,
      teacherRatingsCount: row.teacherRatingsCount,
    }))
  }

  async findTopByCommunity(filters: CurationFilters): Promise<CommunityCurationEntry[]> {
    const weightedScore = sql<number>`coalesce(sum(${projectStars.weight}), 0)`.mapWith(Number)
    const starsCount = count(projectStars.id)

    const rows = await this.db
      .select({ project: projects, weightedScore, starsCount })
      .from(projectStars)
      .innerJoin(projects, eq(projectStars.projectId, projects.id))
      .where(and(eq(projectStars.active, true), ...this.projectConditions(filters)))
      .groupBy(projects.id)
      .orderBy(desc(weightedScore), desc(starsCount), desc(projects.createdAt))
      .limit(filters.limit)

    return rows.map((row) => ({
      project: DrizzleProjectMapper.toDomain(row.project),
      weightedScore: row.weightedScore,
      starsCount: row.starsCount,
    }))
  }
}
