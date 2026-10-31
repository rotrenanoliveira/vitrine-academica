'use server'

import { fetcher } from '@/utils/fetcher'
import type { RatingCriterion } from '@/utils/type'
import { api } from '../../api-client'

export async function listActiveRatingCriteria() {
  const [response, responseError] = await fetcher(
    api.get<{ criteria: RatingCriterion[] }>('api/v1/rating-criteria').json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
