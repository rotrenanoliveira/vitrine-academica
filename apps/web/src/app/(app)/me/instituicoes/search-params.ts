import { createLoader, parseAsStringEnum, type SearchParams, type UrlKeys } from 'nuqs/server'
import type { InstitutionMemberStatus } from '@/utils/type'

const statusValues = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'FINISHED',
  'PENDING',
  'REJECTED',
] as const satisfies readonly InstitutionMemberStatus[]

export const myMembershipsSearchParams = {
  status: parseAsStringEnum([...statusValues]),
}

export const myMembershipsUrlKeys: UrlKeys<typeof myMembershipsSearchParams> = {
  status: 'status',
}

export const loadMyMembershipsFilters = createLoader(myMembershipsSearchParams, {
  urlKeys: myMembershipsUrlKeys,
})

export type MyMembershipsFilters = Awaited<ReturnType<typeof loadMyMembershipsFilters>>
export type { SearchParams }
