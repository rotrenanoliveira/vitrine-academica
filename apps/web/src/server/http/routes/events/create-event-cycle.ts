'use server'

import { fetcher } from '@/utils/fetcher'
import type { Event, ParticipationScope } from '@/utils/type'
import { api } from '../../api-client'

export async function createEventCycle(input: {
  institutionId: string
  participationScope: ParticipationScope
  name?: string | null
}) {
  return fetcher(
    api
      .post(`api/v1/institutions/${input.institutionId}/events`, {
        json: {
          participationScope: input.participationScope,
          name: input.name,
        },
      })
      .json<{ event: Event }>(),
  )
}
