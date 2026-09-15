'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { PreferenceTag } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchUserPreferenceTags(userId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ preferenceTags: PreferenceTag[] }>(`api/v1/users/${userId}/preference-tags`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedUserPreferenceTags = cache(async (userId: string) => fetchUserPreferenceTags(userId))
