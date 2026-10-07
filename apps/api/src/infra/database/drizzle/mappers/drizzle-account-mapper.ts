import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Account } from '@/domain/identity/enterprise/entities/account'
import type { accounts } from '../schemas/accounts'

type DrizzleAccount = typeof accounts.$inferSelect
type DrizzleAccountInsert = typeof accounts.$inferInsert

export class DrizzleAccountMapper {
  static toDomain(row: DrizzleAccount): Account {
    return Account.create(
      {
        userId: new UniqueEntityId(row.userId),
        avatarId: null,
        createdAt: row.createdAt,
        confirmationAt: row.confirmationAt,
        consentedAt: row.consentedAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(account: Account): DrizzleAccountInsert {
    return {
      id: account.id.toString(),
      userId: account.userId.toString(),
      avatarId: account.avatarId?.toString(),
      createdAt: account.createdAt,
      confirmationAt: account.confirmationAt,
      consentedAt: account.consentedAt,
      updatedAt: account.updatedAt ?? undefined,
    }
  }
}
