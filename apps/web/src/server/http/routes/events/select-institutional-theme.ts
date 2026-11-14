'use server'

import { fetcher } from '@/utils/fetcher'
import type { Event } from '@/utils/type'
import { api } from '../../api-client'

export async function selectInstitutionalTheme(input: { eventId: string; themeId: string }) {
  return fetcher(
    api
      .post(`api/v1/events/${input.eventId}/select-theme`, {
        json: { themeId: input.themeId },
      })
      .json<{ event: Event }>(),
  )
}
