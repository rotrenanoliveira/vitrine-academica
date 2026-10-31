'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectStar } from '@/utils/type'
import { api } from '../../api-client'

export async function getMyStarOnProject(projectId: string) {
  const [response, responseError] = await fetcher(
    api.get<{ star: ProjectStar | null }>(`api/v1/projects/${projectId}/stars/me`).json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
