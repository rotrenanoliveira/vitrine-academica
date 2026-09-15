import type { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import type { Account } from '@/domain/identity/enterprise/entities/account'

export class InMemoryAccountsRepository implements AccountsRepository {
  public items: Account[] = []

  async findByUserId(userId: string): Promise<Account | null> {
    return this.items.find((account) => account.userId.toString() === userId) || null
  }

  async create(account: Account): Promise<void> {
    this.items.push(account)
  }

  async save(account: Account): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === account.id.toString())
    if (index === -1) {
      return
    }

    this.items[index] = account
  }
}
