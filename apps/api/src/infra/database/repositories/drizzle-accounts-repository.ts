import { eq } from 'drizzle-orm'
import type { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import type { Account } from '@/domain/identity/enterprise/entities/account'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleAccountMapper } from '../drizzle/mappers/drizzle-account-mapper'
import { accounts } from '../drizzle/schemas'

export class DrizzleAccountsRepository implements AccountsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByUserId(userId: string): Promise<Account | null> {
    const [row] = await this.db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleAccountMapper.toDomain(row)
  }

  async create(account: Account): Promise<void> {
    await this.db.insert(accounts).values(DrizzleAccountMapper.toPersistence(account))
  }
}
