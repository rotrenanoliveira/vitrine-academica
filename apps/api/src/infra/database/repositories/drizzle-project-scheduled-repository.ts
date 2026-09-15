import { and, eq, gte, lt } from 'drizzle-orm'
import type { ProjectScheduledRepository } from '@/domain/project/application/repositories/project-scheduled-repository'
import type { ProjectScheduled } from '@/domain/project/enterprise/entities/project-scheduled'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectScheduledMapper } from '../drizzle/mappers/drizzle-project-scheduled-mapper'
import { projectScheduled } from '../drizzle/schemas'

function utcDayRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1))

  return { start, end }
}

export class DrizzleProjectScheduledRepository implements ProjectScheduledRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(projectId: string): Promise<ProjectScheduled | null> {
    const [row] = await this.db
      .select()
      .from(projectScheduled)
      .where(eq(projectScheduled.projectId, projectId))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectScheduledMapper.toDomain(row)
  }

  async findManyReadyToPublish(date: Date): Promise<ProjectScheduled[]> {
    const { start, end } = utcDayRange(date)

    const rows = await this.db
      .select()
      .from(projectScheduled)
      .where(and(gte(projectScheduled.publishedIn, start), lt(projectScheduled.publishedIn, end)))

    return rows.map(DrizzleProjectScheduledMapper.toDomain)
  }

  async create(entity: ProjectScheduled): Promise<void> {
    await this.db.insert(projectScheduled).values(DrizzleProjectScheduledMapper.toPersistence(entity))
  }

  async save(entity: ProjectScheduled): Promise<void> {
    await this.db
      .update(projectScheduled)
      .set(DrizzleProjectScheduledMapper.toPersistence(entity))
      .where(eq(projectScheduled.id, entity.id.toString()))
  }

  async delete(entity: ProjectScheduled): Promise<void> {
    await this.db.delete(projectScheduled).where(eq(projectScheduled.id, entity.id.toString()))
  }
}
