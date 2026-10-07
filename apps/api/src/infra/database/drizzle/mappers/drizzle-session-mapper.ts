import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Session } from '@/domain/identity/enterprise/entities/session'
import type { sessions } from '../schemas/sessions'

type DrizzleSession = typeof sessions.$inferSelect
type DrizzleSessionInsert = typeof sessions.$inferInsert

export class DrizzleSessionMapper {
  static toDomain(row: DrizzleSession): Session {
    return Session.create(
      {
        accountId: new UniqueEntityId(row.accountId),
        userId: new UniqueEntityId(row.userId),
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(session: Session): DrizzleSessionInsert {
    return {
      id: session.id.toString(),
      accountId: session.accountId.toString(),
      userId: session.userId.toString(),
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt ?? undefined,
    }
  }
}
