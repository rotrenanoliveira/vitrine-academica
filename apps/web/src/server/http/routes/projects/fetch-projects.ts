'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem, ProjectStatus } from '@/utils/type'
import { api } from '../../api-client'

type FetchProjectsParams = {
  scope?: 'all' | 'user'
  status?: ProjectStatus
  title?: string
  tags?: string | string[]
  page?: number
  limit?: number
}

type FetchProjectsResponse = {
  total: number
  page: number
  limit: number
  projects: ProjectListItem[]
}

export async function fetchProjects({ scope, status, title, tags, page = 1, limit = 100 }: FetchProjectsParams = {}) {
  const searchParams = new URLSearchParams()

  if (scope) searchParams.set('scope', scope)
  if (status) searchParams.set('status', status)
  if (title) searchParams.set('title', title)
  if (tags) {
    for (const tag of Array.isArray(tags) ? tags : [tags]) {
      searchParams.append('tags', tag)
    }
  }
  searchParams.set('page', page.toString())
  searchParams.set('limit', limit.toString())

  const [response, responseError] = await fetcher(
    api.get<FetchProjectsResponse>('api/v1/projects', { cache: 'no-store', searchParams }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
