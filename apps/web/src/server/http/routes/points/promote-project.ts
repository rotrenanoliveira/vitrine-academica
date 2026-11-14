'use server'

import { fetcher } from '@/utils/fetcher'
import type { Promotion } from '@/utils/point-type'
import { api } from '../../api-client'

export async function promoteProject(projectId: string) {
  return await fetcher(api.post<{ promotion: Promotion }>(`api/v1/projects/${projectId}/promotions`).json(), {
    notFound: false,
  })
}
