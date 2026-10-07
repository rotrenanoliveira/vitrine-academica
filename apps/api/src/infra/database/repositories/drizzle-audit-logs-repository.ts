import { eq } from 'drizzle-orm'
import type { AuditLogsRepository } from '@/domain/audit/application/repositories/audit-logs-repository'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleAuditLogMapper } from '../drizzle/mappers/drizzle-audit-log-mapper'
import { auditLogs } from '../drizzle/schemas/audit-log'

export class DrizzleAuditLogsRepository implements AuditLogsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findAll(): Promise<AuditLog[]> {
    const rows = await this.db.select().from(auditLogs)

    return rows.map(DrizzleAuditLogMapper.toDomain)
  }

  async findManyByActorId(actorId: string): Promise<AuditLog[]> {
    const rows = await this.db.select().from(auditLogs).where(eq(auditLogs.actorId, actorId))

    return rows.map(DrizzleAuditLogMapper.toDomain)
  }

  async findManyByResource(resource: string): Promise<AuditLog[]> {
    const rows = await this.db.select().from(auditLogs).where(eq(auditLogs.resource, resource))

    return rows.map(DrizzleAuditLogMapper.toDomain)
  }

  async findManyBySessionId(sessionId: string): Promise<AuditLog[]> {
    const rows = await this.db.select().from(auditLogs).where(eq(auditLogs.sessionId, sessionId))

    return rows.map(DrizzleAuditLogMapper.toDomain)
  }

  async create(auditLog: AuditLog): Promise<void> {
    await this.db.insert(auditLogs).values(DrizzleAuditLogMapper.toPersistence(auditLog))
  }
}
