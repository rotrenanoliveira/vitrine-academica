import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { accounts } from './accounts'
import { users } from './users'

const sessionsTable = pgTable(
  'sessions',
  {
    id: text().notNull().primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    index('sessions_account_id_idx').on(table.accountId),
    index('sessions_user_id_idx').on(table.userId),
  ],
)

export const sessions = sessionsTable
