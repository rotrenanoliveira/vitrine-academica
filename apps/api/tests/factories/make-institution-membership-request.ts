import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UniqueEntityId as UniqueEntityIdClass } from '@/core/entities/unique-entity-id'
import {
  InstitutionMembershipRequest,
  type InstitutionMembershipRequestProps,
  InstitutionMembershipRequestRole,
} from '@/domain/institution/enterprise/entities/institution-membership-request'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembershipRequestsRepository } from '@/infra/database/repositories/drizzle-institution-membership-requests-repository'

export function makeInstitutionMembershipRequest(
  override: Partial<InstitutionMembershipRequestProps> = {},
  id?: UniqueEntityId,
) {
  const request = InstitutionMembershipRequest.create(
    {
      institutionId: new UniqueEntityIdClass().toString(),
      userId: new UniqueEntityIdClass().toString(),
      role: InstitutionMembershipRequestRole.STUDENT,
      ...override,
    },
    id,
  )

  return { request }
}

export async function makeInstitutionMembershipRequestOnDatabase(
  override: Partial<InstitutionMembershipRequestProps> = {},
  id?: UniqueEntityId,
) {
  const { request } = makeInstitutionMembershipRequest(override, id)

  const institutionMembershipRequestsRepository = new DrizzleInstitutionMembershipRequestsRepository(db)

  await institutionMembershipRequestsRepository.create(request)

  return { request }
}
