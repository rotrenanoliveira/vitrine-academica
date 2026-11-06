import { and, eq, sql } from 'drizzle-orm'
import type { ThemeVoteTally, VotesRepository } from '@/domain/event/application/repositories/votes-repository'
import type { Vote } from '@/domain/event/enterprise/entities/vote'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleVoteMapper } from '../drizzle/mappers/drizzle-vote-mapper'
import { eventVotes } from '../drizzle/schemas'

export class DrizzleVotesRepository implements VotesRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByEventAndUser(eventId: string, userId: string): Promise<Vote | null> {
    const [row] = await this.db
      .select()
      .from(eventVotes)
      .where(and(eq(eventVotes.eventId, eventId), eq(eventVotes.userId, userId)))
      .limit(1)

    return row ? DrizzleVoteMapper.toDomain(row) : null
  }

  async findManyByEventId(eventId: string): Promise<Vote[]> {
    const rows = await this.db.select().from(eventVotes).where(eq(eventVotes.eventId, eventId))
    return rows.map(DrizzleVoteMapper.toDomain)
  }

  async countByThemeForEvent(eventId: string): Promise<ThemeVoteTally[]> {
    const rows = await this.db
      .select({
        themeId: eventVotes.themeId,
        votes: sql<number>`count(*)::int`,
      })
      .from(eventVotes)
      .where(eq(eventVotes.eventId, eventId))
      .groupBy(eventVotes.themeId)

    return rows.map((row) => ({ themeId: row.themeId, votes: Number(row.votes) }))
  }

  async create(vote: Vote): Promise<void> {
    await this.db.insert(eventVotes).values(DrizzleVoteMapper.toPersistence(vote))
  }
}
