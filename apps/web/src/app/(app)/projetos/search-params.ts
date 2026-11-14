import { parseAsArrayOf, parseAsString, type UrlKeys } from 'nuqs/server'

export const projectsSearchParams = {
  title: parseAsString,
  tags: parseAsArrayOf(parseAsString),
}

export const projectsUrlKeys: UrlKeys<typeof projectsSearchParams> = {
  title: 'title',
  tags: 'tags',
}
