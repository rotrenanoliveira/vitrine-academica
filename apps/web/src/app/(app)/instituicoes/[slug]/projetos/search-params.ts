import { parseAsArrayOf, parseAsInteger, parseAsString, type UrlKeys } from 'nuqs/server'

export const institutionProjectsSearchParams = {
  title: parseAsString,
  tags: parseAsArrayOf(parseAsString),
  page: parseAsInteger.withDefault(1),
}

export const institutionProjectsUrlKeys: UrlKeys<typeof institutionProjectsSearchParams> = {
  title: 'title',
  tags: 'tags',
  page: 'page',
}
