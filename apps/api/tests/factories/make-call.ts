const { faker } = require('@faker-js/faker/locale/pt_BR')

import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Call, type CallProps } from '@/domain/call/enterprise/entities/call'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

export function makeCall(override: Partial<CallProps> = {}, id?: UniqueEntityId) {
  const call = Call.create(
    {
      authorId: new UniqueEntityId(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      applicationDeadline: new Date(Date.now() + ONE_WEEK_IN_MS),
      ...override,
    },
    id,
  )

  return { call }
}

export async function makeCallOnDatabase(override: Partial<CallProps> = {}, id?: UniqueEntityId) {
  const { call } = makeCall(override, id)

  const callsRepository = new DrizzleCallsRepository(db)

  await callsRepository.create(call)

  return { call }
}
