'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem } from '@/utils/type'
import { api } from '../../api-client'

export interface ScheduledProjectItem {
  project: ProjectListItem
  publishedIn: string
}

export async function fetchScheduledProjects() {
  const [response, responseError] = await fetcher(
    api
      .get<{ scheduledProjects: ScheduledProjectItem[] }>('api/v1/projects/scheduled/soon', { cache: 'no-store' })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export async function fetchScheduledProjectsWithCover() {
  const { scheduledProjects } = await fetchScheduledProjects()
  return scheduledProjects.map(({ project }) => project)
}

export const getCachedScheduledProjects = cache(async () => fetchScheduledProjects())
