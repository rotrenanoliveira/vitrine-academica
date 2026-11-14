import { and, asc, desc, eq } from 'drizzle-orm'
import type { CallApplicationsRepository } from '@/domain/call/application/repositories/call-applications-repository'
import type { CallApplication, CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleCallApplicationMapper } from '../drizzle/mappers/drizzle-call-application-mapper'
import { callApplications } from '../drizzle/schemas'

export class DrizzleCallApplicationsRepository implements CallApplicationsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<CallApplication | null> {
    const [row] = await this.db.select().from(callApplications).where(eq(callApplications.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleCallApplicationMapper.toDomain(row)
  }

  async findByCallIdAndApplicantId(callId: string, applicantId: string): Promise<CallApplication | null> {
    const [row] = await this.db
      .select()
      .from(callApplications)
      .where(and(eq(callApplications.callId, callId), eq(callApplications.applicantId, applicantId)))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleCallApplicationMapper.toDomain(row)
  }

  async findManyByCallId(callId: string, status?: CallApplicationStatus): Promise<CallApplication[]> {
    const conditions = [eq(callApplications.callId, callId)]

    if (status) {
      conditions.push(eq(callApplications.status, status))
    }

    const rows = await this.db
      .select()
      .from(callApplications)
      .where(and(...conditions))
      .orderBy(asc(callApplications.createdAt))

    return rows.map(DrizzleCallApplicationMapper.toDomain)
  }

  async findManyByApplicantId(applicantId: string): Promise<CallApplication[]> {
    const rows = await this.db
      .select()
      .from(callApplications)
      .where(eq(callApplications.applicantId, applicantId))
      .orderBy(desc(callApplications.createdAt))

    return rows.map(DrizzleCallApplicationMapper.toDomain)
  }

  async create(application: CallApplication): Promise<void> {
    await this.db.insert(callApplications).values(DrizzleCallApplicationMapper.toPersistence(application))
  }

  async save(application: CallApplication): Promise<void> {
    await this.db
      .update(callApplications)
      .set(DrizzleCallApplicationMapper.toPersistence(application))
      .where(eq(callApplications.id, application.id.toString()))
  }
}
