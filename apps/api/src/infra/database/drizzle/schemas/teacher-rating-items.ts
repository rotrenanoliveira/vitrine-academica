import { pgTable, real, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { projectTeacherRatings } from './project-teacher-ratings'
import { ratingCriteria } from './rating-criteria'

const teacherRatingItemsTable = pgTable(
  'teacher_rating_items',
  {
    id: text().notNull().primaryKey(),
    ratingId: text('rating_id')
      .notNull()
      .references(() => projectTeacherRatings.id, { onDelete: 'cascade' }),
    criterionId: text('criterion_id')
      .notNull()
      .references(() => ratingCriteria.id),
    score: real('score').notNull(),
  },
  (table) => [uniqueIndex('teacher_rating_items_rating_criterion_idx').on(table.ratingId, table.criterionId)],
)

export const teacherRatingItems = teacherRatingItemsTable
