import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Account, type AccountProps } from '@/domain/identity/enterprise/entities/account'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccountMapper } from '@/infra/database/drizzle/mappers/drizzle-account-mapper'
import { accounts } from '@/infra/database/drizzle/schemas'

export function makeAccount(overrides?: Partial<AccountProps>) {
  const account = Account.create({
    userId: new UniqueEntityId(),
    avatarId: null,
    ...overrides,
  })

  return { account }
}

export async function makeAccountOnDatabase(overrides?: Partial<AccountProps>) {
  const { account } = makeAccount(overrides)

  await db.insert(accounts).values(DrizzleAccountMapper.toPersistence(account))

  return { account }
}
