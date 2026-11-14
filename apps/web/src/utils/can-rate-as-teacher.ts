import type { InstitutionMember } from './type'

const TEACHER_ROLES = new Set(['PROFESSOR', 'TEACHER'])

export function canRateAsTeacher(memberships: InstitutionMember[]) {
  return memberships.some((member) => member.status === 'ACTIVE' && TEACHER_ROLES.has(member.role))
}
