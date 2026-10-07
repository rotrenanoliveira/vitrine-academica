'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Project } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchPublishedProjects() {
  const [response, responseError] = await fetcher(
    api.get<{ projects: Project[] }>('api/v1/projects/published', { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedPublishedProjects = cache(async () => fetchPublishedProjects())
