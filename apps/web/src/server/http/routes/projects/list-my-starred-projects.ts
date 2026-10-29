'use server'

import { fetcher } from '@/utils/fetcher'
import type { StarredProjectItem } from '@/utils/type'
import { api } from '../../api-client'

export async function listMyStarredProjects() {
  const [response, responseError] = await fetcher(
    api.get<{ items: StarredProjectItem[] }>('api/v1/me/starred-projects').json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
