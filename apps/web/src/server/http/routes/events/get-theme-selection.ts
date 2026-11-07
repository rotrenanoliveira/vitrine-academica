'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Event, EventTheme } from '@/utils/type'
import { api } from '../../api-client'

export async function getThemeSelection(eventId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ event: Event; themes: EventTheme[] }>(`api/v1/events/${eventId}/theme-selection`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedThemeSelection = cache(async (eventId: string, _userId: string) => getThemeSelection(eventId))
