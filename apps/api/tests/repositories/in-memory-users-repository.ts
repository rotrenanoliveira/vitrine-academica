import type { UsersRepository } from '@/domain/application/repositories/users-repository'
import type { User } from '@/domain/enterprise/entities/user'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((user) => user.email === email) || null
  }

  async create(user: User): Promise<void> {
    this.items.push(user)
  }
}
