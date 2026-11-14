'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type GetMyPointsBalanceResponse = {
  balance: number
}

export async function getMyPointsBalance() {
  const [response, responseError] = await fetcher(
    api.get<GetMyPointsBalanceResponse>('api/v1/points/me', { cache: 'no-store' }).json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedMyPointsBalance = cache(async () => getMyPointsBalance())
