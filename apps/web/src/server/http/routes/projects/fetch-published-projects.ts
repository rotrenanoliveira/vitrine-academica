'use server'

import { cache } from 'react'
import { getAccessTokenCookie } from '@/server/auth/cookies'
import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem } from '@/utils/type'
import { api } from '../../api-client'

type FetchPublishedProjectsParams = {
  page?: number
  limit?: number
}

type FetchProjectsResponse = {
  total: number
  page: number
  limit: number
  projects: ProjectListItem[]
}

export async function fetchPublishedProjects({ page = 1, limit = 25 }: FetchPublishedProjectsParams = {}) {
  const token = await getAccessTokenCookie()

  const [response, responseError] = await fetcher(
    api
      .get<FetchProjectsResponse>('api/v1/projects', {
        searchParams: {
          status: 'PUBLISHED',
          page: page.toString(),
          limit: limit.toString(),
          ...(token ? { scope: 'user' } : {}),
        },
        cache: 'no-store',
      })
      .json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export async function fetchPublishedProjectsWithCover(params: FetchPublishedProjectsParams = {}) {
  return fetchPublishedProjects(params)
}

export const getCachedPublishedProjects = cache(async (params: FetchPublishedProjectsParams = {}) =>
  fetchPublishedProjects(params),
)
