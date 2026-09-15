import { InstitutionMemberRole, InstitutionMemberStatus } from '../../enterprise/entities/institution-member'
import type { InstitutionMembersRepository } from '../repositories/institution-members-repository'

export async function canManageInstitution(
  membersRepository: InstitutionMembersRepository,
  institutionId: string,
  userId: string,
): Promise<boolean> {
  const member = await membersRepository.findByInstitutionAndUser(institutionId, userId)

  if (!member) {
    return false
  }

  if (member.status !== InstitutionMemberStatus.ACTIVE) {
    return false
  }

  return member.role === InstitutionMemberRole.MANAGER || member.role === InstitutionMemberRole.ADMINISTRATIVE_OFFICE
}
