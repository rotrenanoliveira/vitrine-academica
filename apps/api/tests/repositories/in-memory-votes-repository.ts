import type { ThemeVoteCounter, VotesRepository } from '@/domain/event/application/repositories/votes-repository'
import type { Vote } from '@/domain/event/enterprise/entities/vote'

export class InMemoryVotesRepository implements VotesRepository {
  public items: Vote[] = []

  async findByEventAndUser(eventId: string, userId: string): Promise<Vote | null> {
    return this.items.find((vote) => vote.eventId.toString() === eventId && vote.userId.toString() === userId) ?? null
  }

  async findManyByEventId(eventId: string): Promise<Vote[]> {
    return this.items.filter((vote) => vote.eventId.toString() === eventId)
  }

  async countByThemeForEvent(eventId: string): Promise<ThemeVoteCounter[]> {
    const counts = new Map<string, number>()

    for (const vote of this.items) {
      if (vote.eventId.toString() !== eventId) continue
      const themeId = vote.themeId.toString()
      counts.set(themeId, (counts.get(themeId) ?? 0) + 1)
    }

    return Array.from(counts.entries()).map(([themeId, votes]) => ({ themeId, votes }))
  }

  async create(vote: Vote): Promise<void> {
    const existing = await this.findByEventAndUser(vote.eventId.toString(), vote.userId.toString())
    if (existing) {
      throw new Error('DuplicateVoteError')
    }
    this.items.push(vote)
  }
}
