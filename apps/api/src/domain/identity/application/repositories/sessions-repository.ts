import type { Session } from '../../enterprise/entities/session'

export interface SessionsRepository {
  findById(id: string): Promise<Session | null>
  findManyByUserId(userId: string): Promise<Session[]>

  create(session: Session): Promise<void>
  save(session: Session): Promise<void>
}
