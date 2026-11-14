import { parseAsArrayOf, parseAsString, type UrlKeys } from 'nuqs/server'

export const callsSearchParams = {
  tags: parseAsArrayOf(parseAsString),
}

export const callsUrlKeys: UrlKeys<typeof callsSearchParams> = {
  tags: 'tags',
}
