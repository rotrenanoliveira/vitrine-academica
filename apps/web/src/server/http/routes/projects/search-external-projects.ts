'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { ExternalProject } from '@/utils/type'
import { api } from '../../api-client'

type Params = {
  q: string
  page?: number
}

type SearchExternalProjectsResponse = {
  projects: ExternalProject[]
  page: number
  perPage: number
  hasNextPage: boolean
}

export async function searchExternalProjects({ q, page = 1 }: Params) {
  const [response, responseError] = await fetcher(
    api
      .get<SearchExternalProjectsResponse>('api/v1/projects/external-search', {
        searchParams: { q, page },
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedSearchExternalProjects = cache(async (q: string, page = 1) =>
  searchExternalProjects({ q, page }),
)
