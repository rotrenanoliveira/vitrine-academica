'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventVote } from '@/utils/type'
import { api } from '../../api-client'

export async function voteTheme(input: { eventId: string; themeId: string }) {
  return fetcher(
    api
      .post(`api/v1/events/${input.eventId}/votes`, {
        json: { themeId: input.themeId },
      })
      .json<{ vote: EventVote }>(),
  )
}
