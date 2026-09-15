'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Project } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchProjectsOfInterest(userId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ projects: Project[] }>(`api/v1/users/${userId}/projects-of-interest`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedProjectsOfInterest = cache(async (userId: string) => fetchProjectsOfInterest(userId))
