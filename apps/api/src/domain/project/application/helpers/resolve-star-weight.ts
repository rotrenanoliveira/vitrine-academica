import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'

const WEIGHTED_ROLES = new Set<InstitutionMemberRole>([InstitutionMemberRole.PROFESSOR, InstitutionMemberRole.TEACHER])

export async function resolveStarWeight(
  institutionMembersRepository: InstitutionMembersRepository,
  userId: string,
): Promise<number> {
  const memberships = await institutionMembersRepository.findManyByUserId(userId)

  const hasWeightedRole = memberships.some(
    (member) => member.status === InstitutionMemberStatus.ACTIVE && WEIGHTED_ROLES.has(member.role),
  )

  return hasWeightedRole ? 5 : 1
}
