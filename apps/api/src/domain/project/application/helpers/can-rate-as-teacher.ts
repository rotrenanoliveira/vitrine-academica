import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'

const TEACHER_ROLES = new Set<InstitutionMemberRole>([InstitutionMemberRole.PROFESSOR, InstitutionMemberRole.TEACHER])

export async function canRateAsTeacher(
  institutionMembersRepository: InstitutionMembersRepository,
  userId: string,
): Promise<boolean> {
  const memberships = await institutionMembersRepository.findManyByUserId(userId)

  return memberships.some(
    (member) => member.status === InstitutionMemberStatus.ACTIVE && TEACHER_ROLES.has(member.role),
  )
}
