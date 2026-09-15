import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const institutionTypeEnum = pgEnum('institution_type', [
  'UNIVERSITY',
  'COLLEGE',
  'CENTER',
  'TECHNICAL_COLLEGE',
  'OTHER',
])

export const institutionStatusEnum = pgEnum('institution_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'])

export const institutionOriginEnum = pgEnum('institution_origin', ['SEED', 'USER_REGISTRATION', 'ADMIN'])

const institutionsTable = pgTable(
  'institutions',
  {
    id: text().notNull().primaryKey(),
    name: text().notNull(),
    slug: text().notNull(),
    type: institutionTypeEnum('type').notNull(),
    status: institutionStatusEnum('status').notNull().default('ACTIVE'),
    origin: institutionOriginEnum('origin').notNull(),
    description: text().notNull(),
    registerBy: text('register_by')
      .notNull()
      .references(() => users.id),
    shouldProof: boolean('should_proof').notNull().default(false),
    shouldVerify: boolean('should_verify').notNull().default(false),
    domain: text(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('institutions_slug_idx').on(table.slug)],
)

export const institutions = institutionsTable
