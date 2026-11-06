import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallApplication, type CallApplicationProps } from '@/domain/call/enterprise/entities/call-application'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallApplicationsRepository } from '@/infra/database/repositories/drizzle-call-applications-repository'

export function makeCallApplication(override: Partial<CallApplicationProps> = {}, id?: UniqueEntityId) {
  const application = CallApplication.create(
    {
      callId: new UniqueEntityId(),
      applicantId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { application }
}

export async function makeCallApplicationOnDatabase(override: Partial<CallApplicationProps> = {}, id?: UniqueEntityId) {
  const { application } = makeCallApplication(override, id)

  const callApplicationsRepository = new DrizzleCallApplicationsRepository(db)

  await callApplicationsRepository.create(application)

  return { application }
}
