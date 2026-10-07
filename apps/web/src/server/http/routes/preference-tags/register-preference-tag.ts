'use server'

import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type RegisterPreferenceTagParams = {
  userId: string
  tagId: string
}

export async function registerPreferenceTag(data: RegisterPreferenceTagParams) {
  return await fetcher(
    api.post('api/v1/preference-tags', {
      json: data,
    }),
  )
}
