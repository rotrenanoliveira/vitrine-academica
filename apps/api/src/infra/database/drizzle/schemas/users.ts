import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED', 'DELETED'])

const usersTable = pgTable('users', {
  id: text().notNull().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  status: userStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
})

export const users = usersTable
