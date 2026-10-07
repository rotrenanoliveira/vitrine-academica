'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Project, ProjectStatus } from '@/utils/type'
import { api } from '../../api-client'

type Params = {
  status?: ProjectStatus
}

export async function getMyProjects(params: Params = {}) {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)

  const [response, responseError] = await fetcher(
    api
      .get<{ projects: Project[] }>('api/v1/projects/me', {
        searchParams,
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

/** Request-scoped memoization (cookies/auth safe). Tag invalidation via revalidateProjects. */
export const getCachedMyProjects = cache(async (params: Params & { userId: string }) => {
  const { userId: _, ...filters } = params
  return getMyProjects(filters)
})
