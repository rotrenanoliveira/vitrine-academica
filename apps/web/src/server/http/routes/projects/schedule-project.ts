'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectScheduled } from '@/utils/type'
import { api } from '../../api-client'

type ScheduleProjectParams = {
  projectId: string
  publishedIn: string
}

export async function scheduleProject({ projectId, publishedIn }: ScheduleProjectParams) {
  return await fetcher(
    api
      .post<{ projectScheduled: ProjectScheduled }>(`api/v1/projects/${projectId}/schedule`, {
        json: { publishedIn },
      })
      .json(),
  )
}
