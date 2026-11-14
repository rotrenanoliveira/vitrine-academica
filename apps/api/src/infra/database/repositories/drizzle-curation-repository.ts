import { and, desc, eq, gte, ilike, inArray, type SQL } from 'drizzle-orm'
import type {
  CurationFilters,
  CurationRepository,
} from '@/domain/curation/application/repositories/curation-repository'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectMapper } from '../drizzle/mappers/drizzle-project-mapper'
import { institutionMembers } from '../drizzle/schemas/institution-members'
import { projectStars } from '../drizzle/schemas/project-stars'
import { projectTags } from '../drizzle/schemas/project-tags'
import { projectTeacherRatings } from '../drizzle/schemas/project-teacher-ratings'
import { projects } from '../drizzle/schemas/projects'

export class DrizzleCurationRepository implements CurationRepository {
  constructor(private readonly db: DrizzleClient) {}

  private projectConditions({ since, institutionId, title, tagIds }: CurationFilters) {
    const conditions: SQL[] = [eq(projects.status, 'PUBLISHED'), gte(projects.createdAt, since)]

    if (institutionId) {
      const institutionAuthors = this.db
        .select({ userId: institutionMembers.userId })
        .from(institutionMembers)
        .where(and(eq(institutionMembers.institutionId, institutionId), eq(institutionMembers.status, 'ACTIVE')))

      conditions.push(inArray(projects.authorId, institutionAuthors))
    }

    if (title) {
      const escapedTitle = title.replace(/[\\%_]/g, (character) => `\\${character}`)
      conditions.push(ilike(projects.title, `%${escapedTitle}%`))
    }

    if (tagIds && tagIds.length > 0) {
      const taggedProjects = this.db
        .select({ projectId: projectTags.projectId })
        .from(projectTags)
        .where(inArray(projectTags.tagId, tagIds))

      conditions.push(inArray(projects.id, taggedProjects))
    }

    return conditions
  }

  async findTopByTeachers(filters: CurationFilters): Promise<Project[]> {
    const baseQuery = this.db
      .select({ project: projects })
      .from(projectTeacherRatings)
      .innerJoin(projects, eq(projectTeacherRatings.projectId, projects.id))
      .where(and(...this.projectConditions(filters)))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt))

    const rows = filters.limit === undefined ? await baseQuery : await baseQuery.limit(filters.limit)

    return rows.map((row) => DrizzleProjectMapper.toDomain(row.project))
  }

  async findTopByCommunity(filters: CurationFilters): Promise<Project[]> {
    const baseQuery = this.db
      .select({ project: projects })
      .from(projectStars)
      .innerJoin(projects, eq(projectStars.projectId, projects.id))
      .where(and(eq(projectStars.active, true), ...this.projectConditions(filters)))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt))

    const rows = filters.limit === undefined ? await baseQuery : await baseQuery.limit(filters.limit)

    return rows.map((row) => DrizzleProjectMapper.toDomain(row.project))
  }
}
