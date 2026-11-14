'use server'

import { fetcher } from '@/utils/fetcher'
import type { AuthorProjectsResponse } from '@/utils/newsletter-type'
import { api } from '../../api-client'

export async function fetchAuthorProjects(authorId: string) {
  const [response, responseError] = await fetcher(
    api.get<AuthorProjectsResponse>(`api/v1/authors/${authorId}/projects`, { cache: 'no-store' }).json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export async function fetchAuthorProjectsSafe(authorId: string) {
  return await fetcher(
    api.get<AuthorProjectsResponse>(`api/v1/authors/${authorId}/projects`, { cache: 'no-store' }).json(),
    { notFound: false },
  )
}
