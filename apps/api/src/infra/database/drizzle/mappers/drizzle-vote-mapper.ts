import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Vote } from '@/domain/event/enterprise/entities/vote'
import type { eventVotes } from '../schemas/event-votes'

type DrizzleVote = typeof eventVotes.$inferSelect
type DrizzleVoteInsert = typeof eventVotes.$inferInsert

export class DrizzleVoteMapper {
  static toDomain(row: DrizzleVote): Vote {
    return Vote.create(
      {
        eventId: new UniqueEntityId(row.eventId),
        themeId: new UniqueEntityId(row.themeId),
        userId: new UniqueEntityId(row.userId),
        createdAt: row.createdAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(vote: Vote): DrizzleVoteInsert {
    return {
      id: vote.id.toString(),
      eventId: vote.eventId.toString(),
      themeId: vote.themeId.toString(),
      userId: vote.userId.toString(),
      createdAt: vote.createdAt,
    }
  }
}
