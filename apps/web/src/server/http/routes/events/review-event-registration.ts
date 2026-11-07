'use server'

import { fetcher } from '@/utils/fetcher'
import type { EventRegistration } from '@/utils/type'
import { api } from '../../api-client'

export async function reviewEventRegistration(input: {
  registrationId: string
  action: 'APPROVE' | 'REJECT'
  reason?: string | null
}) {
  return fetcher(
    api
      .patch(`api/v1/events/registrations/${input.registrationId}/review`, {
        json: { action: input.action, reason: input.reason },
      })
      .json<{ registration: EventRegistration }>(),
  )
}
