'use server'

import type { Curation } from '@/utils/curation-types'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type GetCurationParams = {
  institutionId?: string
  months?: number
  limit?: number
}

export async function getCuration({ institutionId, months, limit }: GetCurationParams = {}) {
  const searchParams: Record<string, string | number> = {}

  if (institutionId) searchParams.institutionId = institutionId
  if (months) searchParams.months = months
  if (limit) searchParams.limit = limit

  const [response, responseError] = await fetcher(
    api.get<Curation>('api/v1/curation', { cache: 'no-store', searchParams }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
