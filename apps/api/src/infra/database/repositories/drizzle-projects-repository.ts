import { and, desc, eq, inArray } from 'drizzle-orm'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectMapper } from '../drizzle/mappers/drizzle-project-mapper'
import { projects } from '../drizzle/schemas'

export class DrizzleProjectsRepository implements ProjectsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findAll(): Promise<Project[]> {
    const rows = await this.db.select().from(projects)

    return rows.map(DrizzleProjectMapper.toDomain)
  }

  async findById(id: string): Promise<Project | null> {
    const [row] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1)

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
