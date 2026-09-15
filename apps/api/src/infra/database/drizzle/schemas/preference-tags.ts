import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { tags } from './tags'
import { users } from './users'

export const preferenceTagStatusEnum = pgEnum('preference_tag_status', ['ACTIVE', 'INACTIVE'])

const preferenceTagsTable = pgTable(
  'preference_tags',
  {
    id: text().notNull().primaryKey(),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    status: preferenceTagStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('preference_tag_user_tag_idx').on(table.userId, table.tagId),
    index('preference_tag_user_idx').on(table.userId),
  ],
)

export const preferenceTags = preferenceTagsTable
