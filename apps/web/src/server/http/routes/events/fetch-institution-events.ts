'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Event } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchInstitutionEvents(institutionId: string) {
  const [response, responseError] = await fetcher(
    api.get<{ events: Event[] }>(`api/v1/institutions/${institutionId}/events`, { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedInstitutionEvents = cache(async (institutionId: string) => fetchInstitutionEvents(institutionId))
