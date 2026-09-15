'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Tag } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchTags() {
  const [response, responseError] = await fetcher(api.get<{ tags: Tag[] }>('api/v1/tags', { cache: 'no-store' }).json())

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedTags = cache(async () => fetchTags())
