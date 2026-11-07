import { createLoader, parseAsString, type SearchParams } from 'nuqs/server'

export const callsSearchParams = {
  tag: parseAsString,
}

export const loadCallsFilters = createLoader(callsSearchParams)

export type CallsFilters = Awaited<ReturnType<typeof loadCallsFilters>>
export type { SearchParams }