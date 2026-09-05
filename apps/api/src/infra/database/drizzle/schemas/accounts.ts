import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

const accountsTable = pgTable(
  'accounts',
  {
    id: text().notNull().primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id),
    avatarId: text('avatar_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    confirmationAt: timestamp('confirmation_at'),
    consentedAt: timestamp('consented_at'),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('account_idx').on(table.id), index('user_idx').on(table.userId)],
)

export const accounts = accountsTable
