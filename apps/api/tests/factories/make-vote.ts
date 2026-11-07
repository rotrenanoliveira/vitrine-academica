import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Vote, type VoteProps } from '@/domain/event/enterprise/entities/vote'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleVotesRepository } from '@/infra/database/repositories/drizzle-votes-repository'

export function makeVote(override: Partial<VoteProps> = {}, id?: UniqueEntityId) {
  const vote = Vote.create(
    {
      eventId: override.eventId ?? new UniqueEntityId(),
      themeId: override.themeId ?? new UniqueEntityId(),
      userId: override.userId ?? new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { vote }
}

export async function makeVoteOnDatabase(override: Partial<VoteProps> = {}, id?: UniqueEntityId) {
  const { vote } = makeVote(override, id)
  await new DrizzleVotesRepository(db).create(vote)
  return { vote }
}
