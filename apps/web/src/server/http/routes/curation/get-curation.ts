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

export async function getCuration(params: GetCurationParams = {}) {
  const searchParams = new URLSearchParams({
    ...(params.institutionId && { institutionId: params.institutionId }),
    ...(params.months && { months: params.months.toString() }),
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.scope && { scope: params.scope }),
    ...(params.title && { title: params.title }),
  })

  if (params.tags) {
    const tags = Array.isArray(params.tags) ? params.tags : [params.tags]

    tags.forEach((tag) => {
      searchParams.append('tags', tag)
    })
  }

  const [response, responseError] = await fetcher(
    api.get<Curation>('api/v1/curation', { cache: 'no-store', searchParams }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
