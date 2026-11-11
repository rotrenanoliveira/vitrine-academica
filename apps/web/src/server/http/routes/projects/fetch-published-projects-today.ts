'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem } from '@/utils/type'
import { api } from '../../api-client'

type FetchPublishedProjectsTodayResponse = {
  total: number
  projects: ProjectListItem[]
}

export async function fetchPublishedProjectsToday() {
  const [response, responseError] = await fetcher(
    api.get<FetchPublishedProjectsTodayResponse>('api/v1/projects/published/today', { cache: 'no-store' }).json(),
    { notFound: false },
  )

  if (responseError) return { total: 0, projects: [] }

  return response
}

export async function fetchPublishedProjectsTodayWithCover() {
  const { projects } = await fetchPublishedProjectsToday()
  return projects
}

export const getCachedPublishedProjectsToday = cache(async () => fetchPublishedProjectsToday())
