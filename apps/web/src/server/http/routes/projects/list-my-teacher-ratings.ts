'use server'

import { fetcher } from '@/utils/fetcher'
import type { TeacherRatedProjectItem } from '@/utils/type'
import { api } from '../../api-client'

export async function listMyTeacherRatings() {
  const [response, responseError] = await fetcher(
    api.get<{ items: TeacherRatedProjectItem[] }>('api/v1/me/teacher-ratings').json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
