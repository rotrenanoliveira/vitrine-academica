import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((user) => user.email === email) || null
  }

  async findById(id: string): Promise<User | null> {
    return this.items.find((user) => user.id.toString() === id) || null
  }

  async create(user: User): Promise<void> {
    this.items.push(user)
  }

  async save(user: User): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === user.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = user
  }
}
