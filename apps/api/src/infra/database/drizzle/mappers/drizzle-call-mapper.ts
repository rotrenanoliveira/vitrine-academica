import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Call, type CallStatus } from '@/domain/call/enterprise/entities/call'
import type { calls } from '../schemas/calls'

type DrizzleCall = typeof calls.$inferSelect
type DrizzleCallInsert = typeof calls.$inferInsert

export class DrizzleCallMapper {
  static toDomain(row: DrizzleCall): Call {
    return Call.create(
      {
        authorId: new UniqueEntityId(row.authorId),
        title: row.title,
        description: row.description,
        applicationDeadline: row.applicationDeadline,
        status: row.status as CallStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(call: Call): DrizzleCallInsert {
    return {
      id: call.id.toString(),
      authorId: call.authorId.toString(),
      title: call.title,
      description: call.description,
      applicationDeadline: call.applicationDeadline,
      status: call.status,
      createdAt: call.createdAt,
      updatedAt: call.updatedAt ?? undefined,
    }
  }
}
