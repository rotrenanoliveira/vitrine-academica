import { createLoader, parseAsStringEnum, type SearchParams, type UrlKeys } from 'nuqs/server'
import type { InstitutionMembershipRequestStatus } from '@/utils/type'

const statusValues = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const satisfies readonly InstitutionMembershipRequestStatus[]

export const membershipRequestsSearchParams = {
  status: parseAsStringEnum([...statusValues]).withDefault('PENDING'),
}

export const membershipRequestsUrlKeys: UrlKeys<typeof membershipRequestsSearchParams> = {
  status: 'status',
}

export const loadMembershipRequestsFilters = createLoader(membershipRequestsSearchParams, {
  urlKeys: membershipRequestsUrlKeys,
})

export type MembershipRequestsFilters = Awaited<ReturnType<typeof loadMembershipRequestsFilters>>
export type { SearchParams }
