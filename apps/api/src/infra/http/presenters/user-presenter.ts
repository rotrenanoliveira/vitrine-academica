import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { User } from '@/domain/identity/enterprise/entities/user'

export class UserPresenter {
  static toHTTP(user: User, accountId: UniqueEntityId) {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      status: user.status,
      accountId: accountId.toString(),
    }
  }
}
