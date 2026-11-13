import { and, count, desc, eq, ilike, inArray, type SQL } from 'drizzle-orm'
import type {
  FindManyProjectsFilters,
  ProjectsRepository,
} from '@/domain/project/application/repositories/projects-repositories'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectMapper } from '../drizzle/mappers/drizzle-project-mapper'
import { projects } from '../drizzle/schemas'

export class DrizzleProjectsRepository implements ProjectsRepository {
  constructor(private readonly db: DrizzleClient) {}

  private buildConditions(filters: FindManyProjectsFilters): SQL[] | null {
    if (filters.ids && filters.ids.length === 0) {
      return null
    }

    if (filters.authorIds && filters.authorIds.length === 0) {
      return null
    }

    const conditions: SQL[] = []

    if (filters.ids) {
      conditions.push(inArray(projects.id, filters.ids))
    }

    if (filters.authorIds) {
      conditions.push(inArray(projects.authorId, filters.authorIds))
    }

    if (filters.status) {
      conditions.push(eq(projects.status, filters.status as (typeof projects.status.enumValues)[number]))
    }

    if (filters.title) {
      const escapedTitle = filters.title.replace(/[\\%_]/g, (character) => `\\${character}`)
      conditions.push(ilike(projects.title, `%${escapedTitle}%`))
    }

    return conditions
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.db.select().from(projects).orderBy(desc(projects.createdAt))

    return rows.map(DrizzleProjectMapper.toDomain)
  }

  async findMany(filters: FindManyProjectsFilters = {}): Promise<Project[]> {
    const conditions = this.buildConditions(filters)

    if (conditions === null) {
      return []
    }

    const selection = this.db.select().from(projects)
    const filtered = conditions.length > 0 ? selection.where(and(...conditions)) : selection
    const ordered = filtered.orderBy(desc(projects.createdAt))

    if (filters.page !== undefined && filters.limit !== undefined) {
      const rows = await ordered.limit(filters.limit).offset((filters.page - 1) * filters.limit)
      return rows.map(DrizzleProjectMapper.toDomain)
    }

    if (filters.limit !== undefined) {
      const rows = await ordered.limit(filters.limit)
      return rows.map(DrizzleProjectMapper.toDomain)
    }

    const rows = await ordered

    return rows.map(DrizzleProjectMapper.toDomain)
  }

  async countMany(filters: FindManyProjectsFilters = {}): Promise<number> {
    const conditions = this.buildConditions(filters)

    if (conditions === null) {
      return 0
    }

    const selection = this.db.select({ total: count() }).from(projects)
    const filtered = conditions.length > 0 ? selection.where(and(...conditions)) : selection
    const [row] = await filtered

    return row?.total ?? 0
  }

  async findById(id: string): Promise<Project | null> {
    const [row] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectMapper.toDomain(row)
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const [row] = await this.db.select().from(projects).where(eq(projects.slug, slug)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectMapper.toDomain(row)
  }

  async findManyByIds(ids: string[]): Promise<Project[]> {
    if (ids.length === 0) {
      return []
    }

    const rows = await this.db
      .select()
      .from(projects)
      .where(inArray(projects.id, ids))
      .orderBy(desc(projects.createdAt))

    return rows.map(DrizzleProjectMapper.toDomain)
  }

  async findManyByAuthorId(authorId: string, status?: string): Promise<Project[]> {
    const conditions = [eq(projects.authorId, authorId)]

    if (status) {
      conditions.push(eq(projects.status, status as (typeof projects.status.enumValues)[number]))
    }

    const rows = await this.db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))

    return rows.map(DrizzleProjectMapper.toDomain)
  }

  async create(project: Project): Promise<void> {
    await this.db.insert(projects).values(DrizzleProjectMapper.toPersistence(project))
  }

  async save(project: Project): Promise<void> {
    await this.db
      .update(projects)
      .set(DrizzleProjectMapper.toPersistence(project))
      .where(eq(projects.id, project.id.toString()))
  }

  async delete(project: Project): Promise<void> {
    await this.db.delete(projects).where(eq(projects.id, project.id.toString()))
  }
}
