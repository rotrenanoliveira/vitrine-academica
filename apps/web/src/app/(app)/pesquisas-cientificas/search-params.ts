import { createLoader, parseAsInteger, parseAsString, type SearchParams, type UrlKeys } from 'nuqs/server'

export const externalProjectsSearchParams = {
  query: parseAsString,
  page: parseAsInteger.withDefault(1),
}

export const externalProjectsUrlKeys: UrlKeys<typeof externalProjectsSearchParams> = {
  query: 'q',
  page: 'page',
}

export const loadExternalProjectsFilters = createLoader(externalProjectsSearchParams, {
  urlKeys: externalProjectsUrlKeys,
})

export type ExternalProjectsFilters = Awaited<ReturnType<typeof loadExternalProjectsFilters>>
export type { SearchParams }
