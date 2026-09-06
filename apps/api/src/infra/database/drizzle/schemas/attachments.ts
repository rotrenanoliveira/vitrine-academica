import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

const attachmentsTable = pgTable(
  'attachments',
  {
    id: text().notNull().primaryKey(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer().notNull(),
    name: text('file_name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('attachment_key_idx').on(table.storageKey)],
)

export const attachments = attachmentsTable
