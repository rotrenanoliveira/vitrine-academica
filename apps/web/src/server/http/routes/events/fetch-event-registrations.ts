'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { EventRegistration, Project } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchEventRegistrations(
  eventId: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING',
) {
  const [response, responseError] = await fetcher(
    api
      .get<{ registrations: EventRegistration[]; projects: Project[] }>(`api/v1/events/${eventId}/registrations`, {
        searchParams: { status },
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedEventRegistrations = cache(
  async (eventId: string, _userId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING') =>
    fetchEventRegistrations(eventId, status),
)
