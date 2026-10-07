import type { AccessCode } from '../../enterprise/entities/access-code'

export interface AccessCodesRepository {
  findById(id: string): Promise<AccessCode | null>
  findManyByAccountId(accountId: string): Promise<AccessCode[]>
  findManyActiveByAccountId(accountId: string): Promise<AccessCode[]>
  findActiveByAccountId(accountId: string): Promise<AccessCode | null>

  create(accessCode: AccessCode): Promise<void>
  save(accessCode: AccessCode): Promise<void>
}
