import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallApplication, type CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import type { callApplications } from '../schemas/call-applications'

type DrizzleCallApplication = typeof callApplications.$inferSelect
type DrizzleCallApplicationInsert = typeof callApplications.$inferInsert

export class DrizzleCallApplicationMapper {
  static toDomain(row: DrizzleCallApplication): CallApplication {
    return CallApplication.create(
      {
        callId: new UniqueEntityId(row.callId),
        applicantId: new UniqueEntityId(row.applicantId),
        message: row.message,
        status: row.status as CallApplicationStatus,
        decidedAt: row.decidedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(application: CallApplication): DrizzleCallApplicationInsert {
    return {
      id: application.id.toString(),
      callId: application.callId.toString(),
      applicantId: application.applicantId.toString(),
      message: application.message,
      status: application.status,
      decidedAt: application.decidedAt,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt ?? undefined,
    }
  }
}
