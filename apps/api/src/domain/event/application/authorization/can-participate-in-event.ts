import type { InstitutionMembersRepository } from '@/domain/institution/application/repositories/institution-members-repository'
import { InstitutionMemberStatus } from '@/domain/institution/enterprise/entities/institution-member'
import { type Event, ParticipationScope } from '../../enterprise/entities/event'

export async function canParticipateInEvent(
  membersRepository: InstitutionMembersRepository,
  event: Event,
  userId: string,
): Promise<boolean> {
  if (event.participationScope === ParticipationScope.GLOBAL) {
    return true
  }

  const member = await membersRepository.findByInstitutionAndUser(event.institutionId.toString(), userId)

  if (!member) {
    return false
  }

  return member.status === InstitutionMemberStatus.ACTIVE
}
