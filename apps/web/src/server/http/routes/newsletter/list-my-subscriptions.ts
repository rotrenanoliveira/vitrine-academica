'use server'

import { fetcher } from '@/utils/fetcher'
import type { MySubscriptionItem, SubscriptionStatus } from '@/utils/newsletter-type'
import { api } from '../../api-client'

type ListMySubscriptionsParams = {
  status?: SubscriptionStatus
}

export async function listMySubscriptions({ status }: ListMySubscriptionsParams = {}) {
  const searchParams = new URLSearchParams()

  if (status) searchParams.set('status', status)

  const [response, responseError] = await fetcher(
    api
      .get<{ subscriptions: MySubscriptionItem[] }>('api/v1/subscriptions/me', {
        cache: 'no-store',
        searchParams,
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
