'use server'

import type { Curation, CurationScope } from '@/utils/curation-types'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type GetCurationParams = {
  institutionId?: string
  months?: number
  limit?: number
  scope?: CurationScope
  title?: string
  tags?: string | string[]
}

export async function getCuration({
  institutionId,
  months,
  limit,
  scope,
  title,
  tags,
}: GetCurationParams = {}) {
  const searchParams: Record<string, string | number | string[]> = {}

  if (institutionId) searchParams.institutionId = institutionId
  if (months) searchParams.months = months
  if (limit) searchParams.limit = limit
  if (scope) searchParams.scope = scope
  if (title) searchParams.title = title
  if (tags) searchParams.tags = tags

  const [response, responseError] = await fetcher(
    api.get<Curation>('api/v1/curation', { cache: 'no-store', searchParams }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
