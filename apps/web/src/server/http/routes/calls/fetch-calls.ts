'use server'

import type { CallListItem } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type FetchCallsParams = {
  tags?: string[]
}

export async function fetchCalls({ tags }: FetchCallsParams = {}) {
  const searchParams = new URLSearchParams()

  if (tags) {
    for (const tag of tags) {
      searchParams.append('tags', tag)
    }
  }

  const [response, responseError] = await fetcher(
    api
      .get<{ calls: CallListItem[] }>('api/v1/calls', {
        searchParams: searchParams.size > 0 ? searchParams : undefined,
        cache: 'no-store',
      })
      .json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
