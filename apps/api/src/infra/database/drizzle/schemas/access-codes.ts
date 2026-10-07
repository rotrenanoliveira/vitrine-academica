import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { accounts } from './accounts'

const accessCodesTable = pgTable(
  'access_codes',
  {
    id: text().notNull().primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    codeHash: text('code_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    consumedAt: timestamp('consumed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [index('access_codes_account_id_idx').on(table.accountId)],
)

export const accessCodes = accessCodesTable
