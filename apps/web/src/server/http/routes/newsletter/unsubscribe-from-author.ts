'use server'

import { fetcher } from '@/utils/fetcher'
import type { AuthorSubscription } from '@/utils/newsletter-type'
import { api } from '../../api-client'

export async function unsubscribeFromAuthor(subscriptionId: string) {
  return await fetcher(
    api.post<{ subscription: AuthorSubscription }>(`api/v1/subscriptions/${subscriptionId}/unsubscribe`).json(),
    { notFound: false },
  )
}
