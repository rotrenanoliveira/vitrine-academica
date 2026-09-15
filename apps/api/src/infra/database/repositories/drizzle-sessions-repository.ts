import { eq } from 'drizzle-orm'
import type { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import type { Session } from '@/domain/identity/enterprise/entities/session'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleSessionMapper } from '../drizzle/mappers/drizzle-session-mapper'
import { sessions } from '../drizzle/schemas/sessions'

export class DrizzleSessionsRepository implements SessionsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<Session | null> {
    const [row] = await this.db.select().from(sessions).where(eq(sessions.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleSessionMapper.toDomain(row)
  }

  async create(session: Session): Promise<void> {
    await this.db.insert(sessions).values(DrizzleSessionMapper.toPersistence(session))
  }

  async save(session: Session): Promise<void> {
    await this.db
      .update(sessions)
      .set(DrizzleSessionMapper.toPersistence(session))
      .where(eq(sessions.id, session.id.toString()))
  }
}
