'use server'

import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function deactivatePreferenceTag(tagId: string) {
  return await fetcher(api.post(`api/v1/preference-tags/${tagId}/deactivate`))
}
