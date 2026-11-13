import type { CallsRepository } from '@/domain/call/application/repositories/calls-repository'
import type { Call } from '@/domain/call/enterprise/entities/call'

function newestFirst(a: Call, b: Call) {
  return b.createdAt.getTime() - a.createdAt.getTime()
}

function earliestDeadlineFirst(a: Call, b: Call) {
  return a.applicationDeadline.getTime() - b.applicationDeadline.getTime()
}

export class InMemoryCallsRepository implements CallsRepository {
  public items: Call[] = []

  async findById(id: string): Promise<Call | null> {
    return this.items.find((call) => call.id.toString() === id) ?? null
  }

  async findManyByIds(ids: string[]): Promise<Call[]> {
    return this.items.filter((call) => ids.includes(call.id.toString())).sort(newestFirst)
  }

  async findManyOpen(now: Date): Promise<Call[]> {
    return this.items.filter((call) => call.isAcceptingApplications(now)).sort(newestFirst)
  }

  async findManyExpiredOpen(now: Date): Promise<Call[]> {
    return this.items.filter((call) => call.isOpen() && call.isExpired(now)).sort(earliestDeadlineFirst)
  }

  async findManyByAuthorId(authorId: string): Promise<Call[]> {
    return this.items.filter((call) => call.authorId.toString() === authorId).sort(newestFirst)
  }

  async create(call: Call): Promise<void> {
    this.items.push(call)
  }

  async save(call: Call): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === call.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = call
  }
}
