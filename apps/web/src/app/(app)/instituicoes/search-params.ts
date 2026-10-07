import { createLoader, parseAsString, parseAsStringEnum, type SearchParams, type UrlKeys } from 'nuqs/server'
import type { InstitutionStatus } from '@/utils/type'

const statusValues = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'] as const satisfies readonly InstitutionStatus[]

export const institutionsSearchParams = {
  status: parseAsStringEnum([...statusValues]),
  query: parseAsString,
}

export const institutionsUrlKeys: UrlKeys<typeof institutionsSearchParams> = {
  status: 'status',
  query: 'q',
}

export const loadInstitutionsFilters = createLoader(institutionsSearchParams, {
  urlKeys: institutionsUrlKeys,
})

export type InstitutionsFilters = Awaited<ReturnType<typeof loadInstitutionsFilters>>
export type { SearchParams }
