'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectListItem, ProjectStatus } from '@/utils/type'
import { api } from '../../api-client'

type FetchInstitutionProjectsParams = {
  slug: string
  status?: ProjectStatus
  title?: string
  tags?: string | string[]
  page?: number
  limit?: number
}

type FetchInstitutionProjectsResponse = {
  total: number
  page: number
  limit: number
  projects: ProjectListItem[]
}

export async function fetchInstitutionProjects({
  slug,
  status,
  title,
  tags,
  page,
  limit,
}: FetchInstitutionProjectsParams) {
  const searchParams = new URLSearchParams()

  if (status) searchParams.set('status', status)
  if (title) searchParams.set('title', title)
  if (tags) {
    for (const tag of Array.isArray(tags) ? tags : [tags]) {
      searchParams.append('tags', tag)
    }
  }
  if (page !== undefined) searchParams.set('page', String(page))
  if (limit !== undefined) searchParams.set('limit', String(limit))

  const [response, responseError] = await fetcher(
    api
      .get<FetchInstitutionProjectsResponse>(`api/v1/institutions/slug/${slug}/projects`, {
        cache: 'no-store',
        searchParams,
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
