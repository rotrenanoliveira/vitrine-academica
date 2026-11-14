'use server'

import { fetcher } from '@/utils/fetcher'
import type { SubscriptionStatus } from '@/utils/newsletter-type'
import { api } from '../../api-client'

export async function unsubscribeByToken(token: string) {
  return await fetcher(
    api.post<{ status: SubscriptionStatus }>('api/v1/subscriptions/unsubscribe', { json: { token } }).json(),
    {
      notFound: false,
    },
  )
}
