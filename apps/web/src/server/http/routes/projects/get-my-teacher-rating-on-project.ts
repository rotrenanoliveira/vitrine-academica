'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectTeacherRating } from '@/utils/type'
import { api } from '../../api-client'

export async function getMyTeacherRatingOnProject(projectId: string) {
  const [response, responseError] = await fetcher(
    api.get<{ teacherRating: ProjectTeacherRating | null }>(`api/v1/projects/${projectId}/teacher-ratings/me`).json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
