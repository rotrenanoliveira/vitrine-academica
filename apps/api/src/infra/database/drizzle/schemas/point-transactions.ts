import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const pointTransactionTypeEnum = pgEnum('point_transaction_type', ['CREDIT', 'DEBIT'])

export const pointTransactionReasonEnum = pgEnum('point_transaction_reason', ['STAR_RECEIVED', 'PROMOTION'])

const pointTransactionsTable = pgTable(
  'point_transactions',
  {
    id: text().notNull().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    type: pointTransactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    reason: pointTransactionReasonEnum('reason').notNull(),
    referenceId: text('reference_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('point_transactions_reason_reference_user_idx').on(table.reason, table.referenceId, table.userId),
    index('point_transactions_user_created_idx').on(table.userId, table.createdAt),
  ],
)

export const pointTransactions = pointTransactionsTable
