'use server'

import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function removeProjectTag(projectId: string, tagId: string) {
  return await fetcher(api.delete(`api/v1/projects/${projectId}/tags/${tagId}`))
}
