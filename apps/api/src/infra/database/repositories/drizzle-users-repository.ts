import { eq } from 'drizzle-orm'
import type { UsersRepository } from '@/domain/application/repositories/users-repository'
import type { User } from '@/domain/enterprise/entities/user'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleUserMapper } from '../drizzle/mappers/drizzle-user-mapper'
import { users } from '../drizzle/schemas/users'

export class DrizzleUsersRepository implements UsersRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleUserMapper.toDomain(row)
  }

  async create(user: User): Promise<void> {
    await this.db.insert(users).values(DrizzleUserMapper.toPersistence(user))
  }
}
