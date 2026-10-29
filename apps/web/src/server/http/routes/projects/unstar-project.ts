'use server'

import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function unstarProject(projectId: string) {
  return await fetcher(api.delete(`api/v1/projects/${projectId}/stars`), { notFound: false })
}
