import type { InstitutionMember } from '@/utils/type'

export function canManageInstitution(members: InstitutionMember[], institutionId: string, userId: string): boolean {
  const membership = members.find((item) => item.institutionId === institutionId && item.userId === userId)

  if (!membership) return false

  if (membership.status !== 'ACTIVE') return false

  return membership.role === 'MANAGER' || membership.role === 'ADMINISTRATIVE_OFFICE'
}

export function isActiveInstitutionMember(
  members: InstitutionMember[],
  institutionId: string,
  userId: string,
): boolean {
  return members.some(
    (item) => item.institutionId === institutionId && item.userId === userId && item.status === 'ACTIVE',
  )
}
