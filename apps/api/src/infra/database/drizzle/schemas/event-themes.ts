import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { events } from './events'
import { users } from './users'

export const eventThemeStatusEnum = pgEnum('event_theme_status', ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'])

const eventThemesTable = pgTable(
  'event_themes',
  {
    id: text().notNull().primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    description: text().notNull(),
    status: eventThemeStatusEnum('status').notNull().default('PENDING'),
    moderatedByUserId: text('moderated_by_user_id').references(() => users.id),
    moderatedAt: timestamp('moderated_at'),
    moderationReason: text('moderation_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    index('event_themes_event_status_idx').on(table.eventId, table.status),
    index('event_themes_author_idx').on(table.authorId),
  ],
)

export const eventThemes = eventThemesTable
