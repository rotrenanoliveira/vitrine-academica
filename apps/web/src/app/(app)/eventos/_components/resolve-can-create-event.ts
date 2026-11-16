import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'

/** True when the current user is an active MANAGER or ADMINISTRATIVE_OFFICE of at least one institution. */
export async function resolveCanCreateEvent(): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) return false

  const { members } = await getCachedMyInstitutionMemberships(user.id)

  return members.some((membership) => canManageInstitution(members, membership.institutionId, user.id))
}
