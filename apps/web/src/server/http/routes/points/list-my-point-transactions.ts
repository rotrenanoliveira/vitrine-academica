'use server'

import { fetcher } from '@/utils/fetcher'
import type { PointTransaction } from '@/utils/point-type'
import { api } from '../../api-client'

type ListMyPointTransactionsParams = {
  limit?: number
}

type ListMyPointTransactionsResponse = {
  transactions: PointTransaction[]
}

export async function listMyPointTransactions({ limit = 20 }: ListMyPointTransactionsParams = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('limit', String(limit))

  const [response, responseError] = await fetcher(
    api
      .get<ListMyPointTransactionsResponse>('api/v1/points/me/transactions', {
        cache: 'no-store',
        searchParams,
      })
      .json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
