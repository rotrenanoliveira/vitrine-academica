import { and, desc, eq } from 'drizzle-orm'
import type { ThemesRepository } from '@/domain/event/application/repositories/themes-repository'
import type { Theme, ThemeStatus } from '@/domain/event/enterprise/entities/theme'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleThemeMapper } from '../drizzle/mappers/drizzle-theme-mapper'
import { eventThemes } from '../drizzle/schemas'

export class DrizzleThemesRepository implements ThemesRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<Theme | null> {
    const [row] = await this.db.select().from(eventThemes).where(eq(eventThemes.id, id)).limit(1)
    return row ? DrizzleThemeMapper.toDomain(row) : null
  }

  async findManyByEventId(eventId: string, status?: ThemeStatus): Promise<Theme[]> {
    const conditions = [eq(eventThemes.eventId, eventId)]

    if (status) {
      conditions.push(eq(eventThemes.status, status))
    }

    const rows = await this.db
      .select()
      .from(eventThemes)
      .where(and(...conditions))
      .orderBy(desc(eventThemes.createdAt))

    return rows.map(DrizzleThemeMapper.toDomain)
  }

  async create(theme: Theme): Promise<void> {
    await this.db.insert(eventThemes).values(DrizzleThemeMapper.toPersistence(theme))
  }

  async save(theme: Theme): Promise<void> {
    await this.db
      .update(eventThemes)
      .set(DrizzleThemeMapper.toPersistence(theme))
      .where(eq(eventThemes.id, theme.id.toString()))
  }
}
