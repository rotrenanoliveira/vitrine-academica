import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { attachments } from './attachments'
import { institutions } from './institutions'
import { users } from './users'

export const institutionMembershipRequestRoleEnum = pgEnum('institution_membership_request_role', [
  'STUDENT',
  'PROFESSOR',
  'TEACHER',
  'MANAGER',
  'ADMINISTRATIVE_OFFICE',
])

export const institutionMembershipRequestStatusEnum = pgEnum('institution_membership_request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
])

const institutionMembershipRequestsTable = pgTable(
  'institution_membership_requests',
  {
    id: text().notNull().primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    role: institutionMembershipRequestRoleEnum('role').notNull(),
    status: institutionMembershipRequestStatusEnum('status').notNull().default('PENDING'),
    proofAttachmentId: text('proof_attachment_id').references(() => attachments.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    index('institution_membership_requests_institution_idx').on(table.institutionId),
    index('institution_membership_requests_user_idx').on(table.userId),
  ],
)

export const institutionMembershipRequests = institutionMembershipRequestsTable
