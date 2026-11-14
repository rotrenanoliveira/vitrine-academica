import { parseAsArrayOf, parseAsInteger, parseAsString, type UrlKeys } from 'nuqs/server'

export const projectsSearchParams = {
  title: parseAsString,
  tags: parseAsArrayOf(parseAsString),
  page: parseAsInteger.withDefault(1),
}

export const projectsUrlKeys: UrlKeys<typeof projectsSearchParams> = {
  title: 'title',
  tags: 'tags',
  page: 'page',
}
