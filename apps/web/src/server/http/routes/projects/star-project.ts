'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectStar } from '@/utils/type'
import { api } from '../../api-client'

export async function starProject(projectId: string) {
  return await fetcher(api.post<{ projectStar: ProjectStar }>(`api/v1/projects/${projectId}/stars`).json(), {
    notFound: false,
  })
}
