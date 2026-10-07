import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './projects'

const projectScheduledTable = pgTable(
  'project_scheduled',
  {
    id: text().notNull().primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    publishedIn: timestamp('published_in').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('project_scheduled_project_id_idx').on(table.projectId),
    index('project_scheduled_published_in_idx').on(table.publishedIn),
  ],
)

export const projectScheduled = projectScheduledTable
