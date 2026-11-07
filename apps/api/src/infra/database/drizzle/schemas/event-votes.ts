import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { eventThemes } from './event-themes'
import { events } from './events'
import { users } from './users'

const eventVotesTable = pgTable(
  'event_votes',
  {
    id: text().notNull().primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id),
    themeId: text('theme_id')
      .notNull()
      .references(() => eventThemes.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('event_votes_event_user_idx').on(table.eventId, table.userId),
    index('event_votes_theme_idx').on(table.themeId),
  ],
)

export const eventVotes = eventVotesTable
