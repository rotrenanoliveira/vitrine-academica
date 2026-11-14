'use server'

import { fetcher } from '@/utils/fetcher'
import type { AuthorSubscription } from '@/utils/newsletter-type'
import { api } from '../../api-client'

export async function subscribeToAuthor(authorId: string) {
  return await fetcher(
    api.post<{ subscription: AuthorSubscription }>(`api/v1/authors/${authorId}/subscriptions`).json(),
    {
      notFound: false,
    },
  )
}
