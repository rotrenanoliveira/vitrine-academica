import { createLoader, parseAsString, type SearchParams, type UrlKeys } from 'nuqs/server'

export const externalProjectsSearchParams = {
  query: parseAsString,
}

export const externalProjectsUrlKeys: UrlKeys<typeof externalProjectsSearchParams> = {
  query: 'q',
}

export const loadExternalProjectsFilters = createLoader(externalProjectsSearchParams, {
  urlKeys: externalProjectsUrlKeys,
})

export type ExternalProjectsFilters = Awaited<ReturnType<typeof loadExternalProjectsFilters>>
export type { SearchParams }
