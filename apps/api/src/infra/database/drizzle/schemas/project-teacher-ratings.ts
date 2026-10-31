import { pgTable, real, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { users } from './users'

const projectTeacherRatingsTable = pgTable(
  'project_teacher_ratings',
  {
    id: text().notNull().primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    teacherId: text('teacher_id')
      .notNull()
      .references(() => users.id),
    overallScore: real('overall_score').notNull(),
    ratedAt: timestamp('rated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('project_teacher_ratings_project_teacher_idx').on(table.projectId, table.teacherId)],
)

export const projectTeacherRatings = projectTeacherRatingsTable
