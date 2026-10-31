'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectTeacherRating } from '@/utils/type'
import { api } from '../../api-client'

export async function rateProjectByCriteria(projectId: string, scores: Array<{ criterionId: string; score: number }>) {
  return await fetcher(
    api
      .put<{ rating: ProjectTeacherRating }>(`api/v1/projects/${projectId}/teacher-ratings`, {
        json: { scores },
      })
      .json(),
    { notFound: false },
  )
}
