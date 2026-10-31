import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { users } from './users'

const projectStarsTable = pgTable(
  'project_stars',
  {
    id: text().notNull().primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    weight: integer('weight').notNull().default(1),
    active: boolean('active').notNull().default(true),
    ratedAt: timestamp('rated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('project_stars_project_user_idx').on(table.projectId, table.userId),
    index('project_stars_project_active_idx').on(table.projectId, table.active),
    index('project_stars_user_active_idx').on(table.userId, table.active),
  ],
)

export const projectStars = projectStarsTable
