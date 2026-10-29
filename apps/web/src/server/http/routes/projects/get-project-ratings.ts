'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectRating } from '@/utils/type'
import { api } from '../../api-client'

export async function getProjectRatings(projectId: string) {
  const [response, responseError] = await fetcher(
    api.get<{ rating: ProjectRating }>(`api/v1/projects/${projectId}/ratings`).json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
