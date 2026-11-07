'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Event } from '@/utils/type'
import { api } from '../../api-client'

export async function getPublicEvent(eventIdOrSlug: string) {
  const [response, responseError] = await fetcher(
    api.get<{ event: Event }>(`api/v1/events/${eventIdOrSlug}`, { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedPublicEvent = cache(async (eventIdOrSlug: string) => getPublicEvent(eventIdOrSlug))
