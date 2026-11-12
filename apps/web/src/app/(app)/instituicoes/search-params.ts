import { createLoader, parseAsString, type SearchParams, type UrlKeys } from 'nuqs/server'

export const institutionsSearchParams = {
  query: parseAsString,
}

export const institutionsUrlKeys: UrlKeys<typeof institutionsSearchParams> = {
  query: 'q',
}

export const loadInstitutionsFilters = createLoader(institutionsSearchParams, {
  urlKeys: institutionsUrlKeys,
})

export type InstitutionsFilters = Awaited<ReturnType<typeof loadInstitutionsFilters>>
export type { SearchParams }
