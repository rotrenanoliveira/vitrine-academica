import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { institutions } from './institutions'

export const eventPhaseEnum = pgEnum('event_phase', ['THEME_SELECTION', 'INSTITUTIONAL_SELECTION', 'OPEN', 'CLOSED'])

export const participationScopeEnum = pgEnum('participation_scope', ['GLOBAL', 'INSTITUTION'])

const eventsTable = pgTable(
  'events',
  {
    id: text().notNull().primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    slug: text().notNull(),
    name: text(),
    participationScope: participationScopeEnum('participation_scope').notNull(),
    phase: eventPhaseEnum('phase').notNull().default('THEME_SELECTION'),
    winnerThemeId: text('winner_theme_id'),
    startsAt: timestamp('starts_at').notNull(),
    themeSelectionEndsAt: timestamp('theme_selection_ends_at').notNull(),
    endsAt: timestamp('ends_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('events_slug_idx').on(table.slug),
    index('events_institution_phase_idx').on(table.institutionId, table.phase),
    index('events_phase_theme_selection_ends_at_idx').on(table.phase, table.themeSelectionEndsAt),
    index('events_phase_ends_at_idx').on(table.phase, table.endsAt),
  ],
)

export const events = eventsTable
