'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventTheme } from '@/utils/type'
import { api } from '../../api-client'

export async function suggestTheme(input: { eventId: string; title: string; description: string }) {
  return fetcher(
    api
      .post(`api/v1/events/${input.eventId}/themes`, {
        json: { title: input.title, description: input.description },
      })
      .json<{ theme: EventTheme }>(),
  )
}
