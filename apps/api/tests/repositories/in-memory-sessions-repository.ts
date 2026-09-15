import type { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import type { Session } from '@/domain/identity/enterprise/entities/session'

export class InMemorySessionsRepository implements SessionsRepository {
  public items: Session[] = []

  async create(session: Session): Promise<void> {
    this.items.push(session)
  }

  async save(session: Session): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === session.id.toString())
    if (index === -1) {
      return
    }

    this.items[index] = session
  }

  async findById(id: string): Promise<Session | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }
}
