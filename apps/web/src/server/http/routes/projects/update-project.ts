'use server'

import { fetcher } from '@/utils/fetcher'
import type { Project, ProjectStatus } from '@/utils/type'
import { api } from '../../api-client'

type UpdateProjectParams = {
  id: string
  title: string
  description: string
  status?: ProjectStatus
}

export async function updateProject({ id, ...data }: UpdateProjectParams) {
  return await fetcher(
    api
      .put<{ project: Project }>(`api/v1/projects/${id}`, {
        json: data,
      })
      .json(),
  )
}
