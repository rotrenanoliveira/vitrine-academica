import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { users } from './users'

export const callStatusEnum = pgEnum('call_status', ['OPEN', 'CLOSED'])

const callsTable = pgTable(
  'calls',
  {
    id: text().notNull().primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    description: text().notNull(),
    applicationDeadline: timestamp('application_deadline').notNull(),
    status: callStatusEnum('status').notNull().default('OPEN'),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    index('calls_author_idx').on(table.authorId),
    index('calls_status_deadline_idx').on(table.status, table.applicationDeadline),
    uniqueIndex('calls_project_idx').on(table.projectId),
  ],
)

export const calls = callsTable
