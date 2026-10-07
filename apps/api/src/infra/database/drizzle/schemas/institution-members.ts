import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { institutions } from './institutions'
import { users } from './users'

export const institutionMemberRoleEnum = pgEnum('institution_member_role', [
  'STUDENT',
  'PROFESSOR',
  'TEACHER',
  'MANAGER',
  'ADMINISTRATIVE_OFFICE',
])

export const institutionMemberStatusEnum = pgEnum('institution_member_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'FINISHED',
  'PENDING',
  'REJECTED',
])

const institutionMembersTable = pgTable(
  'institution_members',
  {
    id: text().notNull().primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    role: institutionMemberRoleEnum('role').notNull(),
    status: institutionMemberStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('institution_members_institution_user_idx').on(table.institutionId, table.userId),
    index('institution_members_institution_idx').on(table.institutionId),
    index('institution_members_user_idx').on(table.userId),
  ],
)

export const institutionMembers = institutionMembersTable
