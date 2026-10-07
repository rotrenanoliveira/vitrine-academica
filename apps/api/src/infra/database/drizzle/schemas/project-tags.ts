import { index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { tags } from './tags'

const projectTagsTable = pgTable(
  'project_tags',
  {
    id: text().notNull().primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => [
    uniqueIndex('project_tag_project_tag_idx').on(table.projectId, table.tagId),
    index('project_tag_tag_idx').on(table.tagId),
    index('project_tag_project_idx').on(table.projectId),
  ],
)

export const projectTags = projectTagsTable
