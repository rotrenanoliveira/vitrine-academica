import { and, asc, desc, eq, gt, inArray, lte } from 'drizzle-orm'
import type { CallsRepository } from '@/domain/call/application/repositories/calls-repository'
import type { Call } from '@/domain/call/enterprise/entities/call'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleCallMapper } from '../drizzle/mappers/drizzle-call-mapper'
import { calls } from '../drizzle/schemas'

export class DrizzleCallsRepository implements CallsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<Call | null> {
    const [row] = await this.db.select().from(calls).where(eq(calls.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleCallMapper.toDomain(row)
  }

  async findManyByIds(ids: string[]): Promise<Call[]> {
    if (ids.length === 0) {
      return []
    }

    const rows = await this.db.select().from(calls).where(inArray(calls.id, ids)).orderBy(desc(calls.createdAt))

    return rows.map(DrizzleCallMapper.toDomain)
  }

  async findManyOpen(now: Date): Promise<Call[]> {
    const rows = await this.db
      .select()
      .from(calls)
      .where(and(eq(calls.status, 'OPEN'), gt(calls.applicationDeadline, now)))
      .orderBy(desc(calls.createdAt))

    return rows.map(DrizzleCallMapper.toDomain)
  }

  async findManyExpiredOpen(now: Date): Promise<Call[]> {
    const rows = await this.db
      .select()
      .from(calls)
      .where(and(eq(calls.status, 'OPEN'), lte(calls.applicationDeadline, now)))
      .orderBy(asc(calls.applicationDeadline))

    return rows.map(DrizzleCallMapper.toDomain)
  }

  async findManyByAuthorId(authorId: string): Promise<Call[]> {
    const rows = await this.db.select().from(calls).where(eq(calls.authorId, authorId)).orderBy(desc(calls.createdAt))

    return rows.map(DrizzleCallMapper.toDomain)
  }

  async create(call: Call): Promise<void> {
    await this.db.insert(calls).values(DrizzleCallMapper.toPersistence(call))
  }

  async save(call: Call): Promise<void> {
    await this.db.update(calls).set(DrizzleCallMapper.toPersistence(call)).where(eq(calls.id, call.id.toString()))
  }
}
