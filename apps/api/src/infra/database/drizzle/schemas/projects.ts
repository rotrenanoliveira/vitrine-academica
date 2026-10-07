import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const projectStatusEnum = pgEnum('project_status', ['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'])

const projectsTable = pgTable('projects', {
  id: text().notNull().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id),
  status: projectStatusEnum('status').notNull().default('SKETCH'),
  attachments: text('attachments').array().notNull().default([]),
  tags: text('tags').array().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
})

export const projects = projectsTable
