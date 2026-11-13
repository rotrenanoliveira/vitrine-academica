import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { authorSubscriptions } from './author-subscriptions'
import { projects } from './projects'

export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED'])

const publicationNotificationsTable = pgTable(
  'publication_notifications',
  {
    id: text().notNull().primaryKey(),
    subscriptionId: text('subscription_id')
      .notNull()
      .references(() => authorSubscriptions.id),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    status: notificationStatusEnum('status').notNull().default('PENDING'),
    sentAt: timestamp('sent_at'),
    providerMessageId: text('provider_message_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('publication_notifications_subscription_project_idx').on(table.subscriptionId, table.projectId),
    index('publication_notifications_status_idx').on(table.status),
  ],
)

export const publicationNotifications = publicationNotificationsTable
