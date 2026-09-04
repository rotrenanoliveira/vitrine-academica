import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { User, type UserStatus } from '@/domain/enterprise/entities/user'
import type { users } from '../schemas/users'

type DrizzleUser = typeof users.$inferSelect
type DrizzleUserInsert = typeof users.$inferInsert

export class DrizzleUserMapper {
  static toDomain(row: DrizzleUser): User {
    return User.create(
      {
        name: row.name,
        email: row.email,
        status: row.status as UserStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(user: User): DrizzleUserInsert {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? undefined,
    }
  }
}
