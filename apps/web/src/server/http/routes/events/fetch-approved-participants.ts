'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchApprovedParticipants(eventId: string) {
  const [response, responseError] = await fetcher(
    api.get<{ projects: ProjectListItem[] }>(`api/v1/events/${eventId}/participants`, { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedApprovedParticipants = cache(async (eventId: string) => fetchApprovedParticipants(eventId))
