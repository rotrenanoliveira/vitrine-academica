'use server'

import type { CallWithSkills } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type FetchCallsParams = {
  tagId?: string
}

export async function fetchCalls({ tagId }: FetchCallsParams = {}) {
  const [response, responseError] = await fetcher(
    api
      .get<{ calls: CallWithSkills[] }>('api/v1/calls', {
        searchParams: tagId ? { tagId } : undefined,
        cache: 'no-store',
      })
      .json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}