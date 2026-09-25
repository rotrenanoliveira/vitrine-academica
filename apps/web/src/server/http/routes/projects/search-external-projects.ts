'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { ExternalProject } from '@/utils/type'
import { api } from '../../api-client'

type Params = {
  q: string
}

export async function searchExternalProjects({ q }: Params) {
  const [response, responseError] = await fetcher(
    api
      .get<{ projects: ExternalProject[] }>('api/v1/projects/external-search', {
        searchParams: { q },
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedSearchExternalProjects = cache(async (q: string) => searchExternalProjects({ q }))
