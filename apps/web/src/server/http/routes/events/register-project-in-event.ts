'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventRegistration } from '@/utils/type'
import { api } from '../../api-client'

export async function registerProjectInEvent(input: { eventId: string; projectId: string }) {
  return fetcher(
    api
      .post(`api/v1/events/${input.eventId}/registrations`, {
        json: { projectId: input.projectId },
      })
      .json<{ registration: EventRegistration }>(),
  )
}
