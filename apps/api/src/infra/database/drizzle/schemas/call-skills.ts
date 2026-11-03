import { index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { calls } from './calls'
import { tags } from './tags'

const callSkillsTable = pgTable(
  'call_skills',
  {
    id: text().notNull().primaryKey(),
    callId: text('call_id')
      .notNull()
      .references(() => calls.id),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
    description: text(),
  },
  (table) => [
    uniqueIndex('call_skill_call_tag_idx').on(table.callId, table.tagId),
    index('call_skill_tag_idx').on(table.tagId),
  ],
)

export const callSkills = callSkillsTable
