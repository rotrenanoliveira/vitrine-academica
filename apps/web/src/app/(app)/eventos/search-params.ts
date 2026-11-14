import { parseAsArrayOf, parseAsInteger, parseAsString, type UrlKeys } from 'nuqs/server'

export const eventsSearchParams = {
  institutionIds: parseAsArrayOf(parseAsString),
  page: parseAsInteger.withDefault(1),
}

export const eventsUrlKeys: UrlKeys<typeof eventsSearchParams> = {
  institutionIds: 'institutionIds',
  page: 'page',
}
