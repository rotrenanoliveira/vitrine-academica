import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

const tagsTable = pgTable(
  'tags',
  {
    id: text().notNull().primaryKey(),
    name: text().notNull(),
    slug: text().notNull(),
  },
  (table) => [uniqueIndex('tag_slug_idx').on(table.slug)],
)

export const tags = tagsTable
