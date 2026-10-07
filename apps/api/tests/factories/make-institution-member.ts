import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UniqueEntityId as UniqueEntityIdClass } from '@/core/entities/unique-entity-id'
import {
  InstitutionMember,
  type InstitutionMemberProps,
  InstitutionMemberRole,
} from '@/domain/institution/enterprise/entities/institution-member'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'

export function makeInstitutionMember(override: Partial<InstitutionMemberProps> = {}, id?: UniqueEntityId) {
  const member = InstitutionMember.create(
    {
      institutionId: new UniqueEntityIdClass().toString(),
      userId: new UniqueEntityIdClass().toString(),
      role: InstitutionMemberRole.STUDENT,
      ...override,
    },
    id,
  )

  return { member }
}

export async function makeInstitutionMemberOnDatabase(
  override: Partial<InstitutionMemberProps> = {},
  id?: UniqueEntityId,
) {
  const { member } = makeInstitutionMember(override, id)

  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)

  await institutionMembersRepository.create(member)

  return { member }
}
