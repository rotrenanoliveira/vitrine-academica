'use server'

import { fetcher } from '@/utils/fetcher'
import type { ProjectTeacherRating, RatingCriterion } from '@/utils/type'
import { api } from '../../api-client'

export type ProjectTeacherRatingVoteItem = {
  teacher: {
    id: string
    name: string
  }
  rating: ProjectTeacherRating
}

export async function listProjectTeacherRatings(projectId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ criteria: RatingCriterion[]; items: ProjectTeacherRatingVoteItem[] }>(
        `api/v1/projects/${projectId}/teacher-ratings`,
      )
      .json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
