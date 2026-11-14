'use server'

import { cache } from 'react'
import { getAccessTokenCookie } from '@/server/auth/cookies'
import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem } from '@/utils/type'
import { api } from '../../api-client'

type FetchProjectsResponse = {
  total: number
  projects: ProjectListItem[]
}

export async function fetchPublishedProjects() {
  const token = await getAccessTokenCookie()

  const [response, responseError] = await fetcher(
    api
      .get<FetchProjectsResponse>('api/v1/projects', {
        searchParams: {
          status: 'PUBLISHED',
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

export async function fetchPublishedProjectsWithCover() {
  const { projects } = await fetchPublishedProjects()

  return projects
}

export const getCachedPublishedProjects = cache(async () => fetchPublishedProjects())
