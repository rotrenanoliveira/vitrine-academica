'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventListItem, EventPhase, ParticipationScope } from '@/utils/type'
import { api } from '../../api-client'

type FetchPublicEventsParams = {
  page?: number
  perPage?: number
  institutionIds?: string[]
  phase?: EventPhase | EventPhase[]
  participationScope?: ParticipationScope
}

export type FetchPublicEventsResponse = {
  events: EventListItem[]
  total: number
  page: number
  perPage: number
}

export async function fetchPublicEvents(params: FetchPublicEventsParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.perPage) searchParams.set('perPage', params.perPage.toString())
  if (params.participationScope) searchParams.set('participationScope', params.participationScope)

  if (params.institutionIds) {
    for (const institutionId of params.institutionIds) {
      searchParams.append('institutionIds', institutionId)
    }
  }

  if (params.phase) {
    const phases = Array.isArray(params.phase) ? params.phase : [params.phase]
    for (const phase of phases) {
      searchParams.append('phase', phase)
    }
  }

  const [response, responseError] = await fetcher(
    api.get<FetchPublicEventsResponse>('api/v1/events', { cache: 'no-store', searchParams }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
