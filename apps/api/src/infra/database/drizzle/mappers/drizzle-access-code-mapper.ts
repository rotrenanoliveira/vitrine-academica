import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AccessCode } from '@/domain/identity/enterprise/entities/access-code'
import type { accessCodes } from '../schemas/access-codes'

type DrizzleAccessCode = typeof accessCodes.$inferSelect
type DrizzleAccessCodeInsert = typeof accessCodes.$inferInsert

export class DrizzleAccessCodeMapper {
  static toDomain(row: DrizzleAccessCode): AccessCode {
    return AccessCode.create(
      {
        accountId: new UniqueEntityId(row.accountId),
        codeHash: row.codeHash,
        expiresAt: row.expiresAt,
        consumedAt: row.consumedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(accessCode: AccessCode): DrizzleAccessCodeInsert {
    return {
      id: accessCode.id.toString(),
      accountId: accessCode.accountId.toString(),
      codeHash: accessCode.codeHash,
      expiresAt: accessCode.expiresAt,
      consumedAt: accessCode.consumedAt,
      createdAt: accessCode.createdAt,
      updatedAt: accessCode.updatedAt ?? undefined,
    }
  }
}
