import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { calls } from './calls'
import { users } from './users'

export const callApplicationStatusEnum = pgEnum('call_application_status', ['PENDING', 'APPROVED', 'REJECTED'])

const callApplicationsTable = pgTable(
  'call_applications',
  {
    id: text().notNull().primaryKey(),
    callId: text('call_id')
      .notNull()
      .references(() => calls.id),
    applicantId: text('applicant_id')
      .notNull()
      .references(() => users.id),
    message: text(),
    status: callApplicationStatusEnum('status').notNull().default('PENDING'),
    decidedAt: timestamp('decided_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('call_application_call_applicant_idx').on(table.callId, table.applicantId),
    index('call_application_applicant_idx').on(table.applicantId),
  ],
)

export const callApplications = callApplicationsTable
