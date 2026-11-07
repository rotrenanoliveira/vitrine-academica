'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventTheme } from '@/utils/type'
import { api } from '../../api-client'

export async function moderateTheme(input: {
  themeId: string
  action: 'APPROVE' | 'REJECT' | 'HIDE'
  reason?: string | null
}) {
  return fetcher(
    api
      .patch(`api/v1/events/themes/${input.themeId}/moderation`, {
        json: { action: input.action, reason: input.reason },
      })
      .json<{ theme: EventTheme }>(),
  )
}
