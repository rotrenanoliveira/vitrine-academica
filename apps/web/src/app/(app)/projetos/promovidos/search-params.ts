import { parseAsInteger, type UrlKeys } from 'nuqs/server'

export const promotedProjectsSearchParams = {
  page: parseAsInteger.withDefault(1),
}

export const promotedProjectsUrlKeys: UrlKeys<typeof promotedProjectsSearchParams> = {
  page: 'page',
}
