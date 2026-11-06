'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { EventTheme } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchApprovedThemes(eventId: string) {
  const [response, responseError] = await fetcher(
    api.get<{ themes: EventTheme[] }>(`api/v1/events/${eventId}/themes`, { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedApprovedThemes = cache(async (eventId: string) => fetchApprovedThemes(eventId))
