import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { users } from './users'

export const projectMemberStatusEnum = pgEnum('project_member_status', ['PENDING', 'ACCEPTED', 'REJECTED'])

const projectMembersTable = pgTable(
  'project_members',
  {
    id: text().notNull().primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    status: projectMemberStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('project_members_project_user_idx').on(table.projectId, table.userId),
    index('project_members_user_idx').on(table.userId),
  ],
)

export const projectMembers = projectMembersTable
