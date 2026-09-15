import type { AccessCodesRepository } from '@/domain/identity/application/repositories/access-codes-repository'
import type { AccessCode } from '@/domain/identity/enterprise/entities/access-code'

export class InMemoryAccessCodesRepository implements AccessCodesRepository {
  public items: AccessCode[] = []

  async create(accessCode: AccessCode): Promise<void> {
    this.items.push(accessCode)
  }

  async save(accessCode: AccessCode): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === accessCode.id.toString())
    if (index === -1) {
      return
    }

    this.items[index] = accessCode
  }

  async findById(id: string): Promise<AccessCode | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findManyByAccountId(accountId: string): Promise<AccessCode[]> {
    return this.items.filter((item) => item.accountId.toString() === accountId)
  }

  async findManyActiveByAccountId(accountId: string): Promise<AccessCode[]> {
    return this.items.filter((item) => item.accountId.toString() === accountId).filter((item) => !item.isConsumed())
  }

  async findActiveByAccountId(accountId: string): Promise<AccessCode | null> {
    return (
      this.items
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .filter((item) => item.accountId.toString() === accountId)
        .find((item) => !item.isConsumed()) ?? null
    )
  }
}
