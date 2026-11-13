import { sql } from 'drizzle-orm'
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { users } from './users'

export const promotionStatusEnum = pgEnum('promotion_status', ['ACTIVE', 'EXPIRED'])

const promotionsTable = pgTable(
  'promotions',
  {
    id: text().notNull().primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    promoterId: text('promoter_id')
      .notNull()
      .references(() => users.id),
    cost: integer('cost').notNull(),
    status: promotionStatusEnum('status').notNull().default('ACTIVE'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('promotions_active_project_promoter_idx')
      .on(table.projectId, table.promoterId)
      .where(sql`${table.status} = 'ACTIVE'`),
    index('promotions_project_status_idx').on(table.projectId, table.status),
    index('promotions_status_expires_idx').on(table.status, table.expiresAt),
  ],
)

export const promotions = promotionsTable
