import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { events } from './events'
import { projects } from './projects'
import { users } from './users'

export const eventRegistrationStatusEnum = pgEnum('event_registration_status', ['PENDING', 'APPROVED', 'REJECTED'])

const eventRegistrationsTable = pgTable(
  'event_registrations',
  {
    id: text().notNull().primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    responsibleUserId: text('responsible_user_id')
      .notNull()
      .references(() => users.id),
    status: eventRegistrationStatusEnum('status').notNull().default('PENDING'),
    reviewedByUserId: text('reviewed_by_user_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    reviewReason: text('review_reason'),
    registeredAt: timestamp('registered_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('event_registrations_event_project_idx').on(table.eventId, table.projectId),
    index('event_registrations_event_status_idx').on(table.eventId, table.status),
    index('event_registrations_project_idx').on(table.projectId),
  ],
)

export const eventRegistrations = eventRegistrationsTable
