'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { EventVoteCounter } from '@/utils/type'
import { api } from '../../api-client'

export async function getVoteCounter(eventId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ counter: EventVoteCounter[] }>(`api/v1/events/${eventId}/vote-counter`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedVoteCounter = cache(async (eventId: string, _userId: string) => getVoteCounter(eventId))
