'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem, ProjectStatus } from '@/utils/type'
import { api } from '../../api-client'

type FetchProjectsParams = {
  scope?: 'all' | 'user'
  status?: ProjectStatus
  title?: string
  tags?: string | string[]
}

type FetchProjectsResponse = {
  total: number
  projects: ProjectListItem[]
}

export async function fetchProjects({ scope, status, title, tags }: FetchProjectsParams = {}) {
  const searchParams = new URLSearchParams()

  if (scope) searchParams.set('scope', scope)
  if (status) searchParams.set('status', status)
  if (title) searchParams.set('title', title)
  if (tags) {
    for (const tag of Array.isArray(tags) ? tags : [tags]) {
      searchParams.append('tags', tag)
    }
  }

  const [response, responseError] = await fetcher(
    api.get<FetchProjectsResponse>('api/v1/projects', { cache: 'no-store', searchParams }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
