import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED'])

const authorSubscriptionsTable = pgTable(
  'author_subscriptions',
  {
    id: text().notNull().primaryKey(),
    subscriberId: text('subscriber_id')
      .notNull()
      .references(() => users.id),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id),
    email: text().notNull(),
    unsubscribeToken: text('unsubscribe_token').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('ACTIVE'),
    subscribedAt: timestamp('subscribed_at').notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at'),
  },
  (table) => [
    uniqueIndex('author_subscriptions_subscriber_author_idx').on(table.subscriberId, table.authorId),
    uniqueIndex('author_subscriptions_unsubscribe_token_idx').on(table.unsubscribeToken),
    index('author_subscriptions_author_idx').on(table.authorId),
  ],
)

export const authorSubscriptions = authorSubscriptionsTable
