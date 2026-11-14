'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventListItem, EventPhase, ParticipationScope } from '@/utils/type'
import { api } from '../../api-client'

type FetchInstitutionEventsParams = {
  page?: number
  perPage?: number
  phase?: EventPhase
  participationScope?: ParticipationScope
}

export async function fetchInstitutionEvents(institutionId: string, params: FetchInstitutionEventsParams = {}) {
  const searchParams = new URLSearchParams({
    ...(params.page && { page: params.page.toString() }),
    ...(params.perPage && { perPage: params.perPage.toString() }),
    ...(params.phase && { phase: params.phase }),
    ...(params.participationScope && { participationScope: params.participationScope }),
  })

  const [response, responseError] = await fetcher(
    api
      .get<{ events: EventListItem[] }>(`api/v1/institutions/${institutionId}/events`, {
        cache: 'no-store',
        searchParams,
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
