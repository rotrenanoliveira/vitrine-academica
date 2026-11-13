'use server'

import { fetcher } from '@/utils/fetcher'
import type { Project } from '@/utils/type'
import { api } from '../../api-client'

export async function getProjectBySlug(slug: string) {
  const [response, responseError] = await fetcher(api.get<{ project: Project }>(`api/v1/projects/slug/${slug}`).json())

  if (responseError) throw new Error(responseError.message)

  return response
}
