import type { Account } from '../../enterprise/entities/account'

export interface AccountsRepository {
  findByUserId(userId: string): Promise<Account | null>

  create(account: Account): Promise<void>
}
