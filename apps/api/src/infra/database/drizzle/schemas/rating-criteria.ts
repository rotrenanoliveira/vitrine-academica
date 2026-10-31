import { boolean, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core'

const ratingCriteriaTable = pgTable('rating_criteria', {
  id: text().notNull().primaryKey(),
  name: text().notNull(),
  description: text(),
  weight: real('weight').notNull().default(1),
  active: boolean('active').notNull().default(true),
  validFrom: timestamp('valid_from').notNull().defaultNow(),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
})

export const ratingCriteria = ratingCriteriaTable
