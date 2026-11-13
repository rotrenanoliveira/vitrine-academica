import type { Call } from '../../enterprise/entities/call'

export interface CallsRepository {
  findById(id: string): Promise<Call | null>
  findManyByIds(ids: string[]): Promise<Call[]>
  findManyOpen(now: Date): Promise<Call[]>
  findManyExpiredOpen(now: Date): Promise<Call[]>
  findManyByAuthorId(authorId: string): Promise<Call[]>

  create(call: Call): Promise<void>
  save(call: Call): Promise<void>
}
