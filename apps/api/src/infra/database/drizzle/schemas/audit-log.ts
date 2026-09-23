import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { sessions } from './sessions'

export const auditLogActionEnum = pgEnum('audit_log_action_enum', ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'])

export const auditLogStatusEnum = pgEnum('audit_log_status_enum', ['SUCCESS', 'FAILURE'])

const auditLogsTable = pgTable('audit_logs', {
  id: text().notNull().primaryKey(),
  timestamp: timestamp().notNull(),
  actorId: text('actor_id').notNull(),
  sessionId: text('session_id').references(() => sessions.id),
  action: auditLogActionEnum().notNull(),
  resource: text().notNull(),
  resourceId: text('resource_id').notNull(),
  diff: jsonb(),
  text: text(),
  status: auditLogStatusEnum().notNull(),
})

export const auditLogs = auditLogsTable
