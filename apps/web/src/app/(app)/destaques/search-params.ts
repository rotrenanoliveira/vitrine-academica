import { parseAsArrayOf, parseAsString, parseAsStringEnum, type UrlKeys } from 'nuqs/server'

const periodValues = ['1', '3', '6', '12'] as const

export const destaquesSearchParams = {
  title: parseAsString,
  institutionIds: parseAsArrayOf(parseAsString),
  tags: parseAsArrayOf(parseAsString),
  months: parseAsStringEnum([...periodValues]).withDefault('3'),
}

export const destaquesUrlKeys: UrlKeys<typeof destaquesSearchParams> = {
  title: 'title',
  institutionIds: 'institutionIds',
  tags: 'tags',
  months: 'months',
}
