'use server'

import { fetcher } from '@/utils/fetcher'
import type { Project } from '@/utils/type'
import { api } from '../../api-client'

type PublishProjectParams = {
  projectId: string
}

export async function publishProject({ projectId }: PublishProjectParams) {
  return await fetcher(api.post<{ project: Project }>(`api/v1/projects/${projectId}/publish-now`).json())
}
