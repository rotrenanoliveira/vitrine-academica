import type { Vote } from '../../enterprise/entities/vote'

export interface ThemeVoteTally {
  themeId: string
  votes: number
}

export interface VotesRepository {
  findByEventAndUser(eventId: string, userId: string): Promise<Vote | null>
  findManyByEventId(eventId: string): Promise<Vote[]>
  countByThemeForEvent(eventId: string): Promise<ThemeVoteTally[]>
  create(vote: Vote): Promise<void>
}
