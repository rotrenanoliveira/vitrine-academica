'use server'

import { fetcher } from '@/utils/fetcher'
import type { Project } from '@/utils/type'
import { api } from '../../api-client'

type RegisterProjectParams = {
  title: string
  description: string
  attachments: string[]
}

export async function registerProject(data: RegisterProjectParams) {
  return await fetcher(
    api
      .post<{ project: Project }>('api/v1/projects', {
        json: data,
      })
      .json(),
  )
}
