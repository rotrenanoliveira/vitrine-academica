'use server'

import { fetcher } from '@/utils/fetcher'
import type { ListActivePromotionsResponse } from '@/utils/point-type'
import { api } from '../../api-client'

type ListActivePromotionsParams = {
  page?: number
  limit?: number
}

export async function listActivePromotions({ page = 1, limit = 20 }: ListActivePromotionsParams = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('limit', String(limit))

  const [response, responseError] = await fetcher(
    api
      .get<ListActivePromotionsResponse>('api/v1/promotions/active', {
        cache: 'no-store',
        searchParams,
      })
      .json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
