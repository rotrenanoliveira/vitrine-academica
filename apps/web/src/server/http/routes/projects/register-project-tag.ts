'use server'

import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function registerProjectTag(projectId: string, tagId: string) {
  return await fetcher(
    api.post(`api/v1/projects/${projectId}/tags`, {
      json: { tagId },
    }),
  )
}
