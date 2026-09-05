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
}
