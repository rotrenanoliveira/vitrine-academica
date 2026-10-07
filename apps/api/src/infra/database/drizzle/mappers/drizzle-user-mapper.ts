import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { User, type UserStatus } from '@/domain/identity/enterprise/entities/user'
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
      updatedAt: user.updatedAt ?? undefined,
    }
  }
}
