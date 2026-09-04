const { faker } = require('@faker-js/faker/locale/pt_BR')

import { User, type UserProps } from '@/domain/enterprise/entities/user'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'

export function makeUser(override: Partial<UserProps> = {}) {
  const user = User.create({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    ...override,
  })

  return { user }
}

export async function makeUserOnDatabase(override: Partial<UserProps> = {}) {
  const { user } = makeUser(override)

  const usersRepository = new DrizzleUsersRepository(db)

  await usersRepository.create(user)

  return { user }
}
