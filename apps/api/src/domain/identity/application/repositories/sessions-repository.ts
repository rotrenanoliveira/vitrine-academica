import type { Session } from '../../enterprise/entities/session'

export interface SessionsRepository {
  findById(id: string): Promise<Session | null>

  create(session: Session): Promise<void>
  save(session: Session): Promise<void>
}
