import { and, desc, eq, isNull } from 'drizzle-orm'
import type { AccessCodesRepository } from '@/domain/identity/application/repositories/access-codes-repository'
import type { AccessCode } from '@/domain/identity/enterprise/entities/access-code'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleAccessCodeMapper } from '../drizzle/mappers/drizzle-access-code-mapper'
import { accessCodes } from '../drizzle/schemas/access-codes'

export class DrizzleAccessCodesRepository implements AccessCodesRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<AccessCode | null> {
    const [row] = await this.db.select().from(accessCodes).where(eq(accessCodes.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleAccessCodeMapper.toDomain(row)
  }

  async findManyByAccountId(accountId: string): Promise<AccessCode[]> {
    const rows = await this.db.select().from(accessCodes).where(eq(accessCodes.accountId, accountId))

    return rows.map(DrizzleAccessCodeMapper.toDomain)
  }

  async findManyActiveByAccountId(accountId: string): Promise<AccessCode[]> {
    const rows = await this.db
      .select()
      .from(accessCodes)
      .where(and(eq(accessCodes.accountId, accountId), isNull(accessCodes.consumedAt)))

    return rows.map(DrizzleAccessCodeMapper.toDomain)
  }

  async findActiveByAccountId(accountId: string): Promise<AccessCode | null> {
    const [row] = await this.db
      .select()
      .from(accessCodes)
      .where(and(eq(accessCodes.accountId, accountId), isNull(accessCodes.consumedAt)))
      .orderBy(desc(accessCodes.createdAt))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleAccessCodeMapper.toDomain(row)
  }

  async create(accessCode: AccessCode): Promise<void> {
    await this.db.insert(accessCodes).values(DrizzleAccessCodeMapper.toPersistence(accessCode))
  }

  async save(accessCode: AccessCode): Promise<void> {
    await this.db
      .update(accessCodes)
      .set(DrizzleAccessCodeMapper.toPersistence(accessCode))
      .where(eq(accessCodes.id, accessCode.id.toString()))
  }
}
