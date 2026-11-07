'use server'

import type { CallSkillInput, CallWithSkills } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type UpdateCallParams = {
  id: string
  title: string
  description: string
  applicationDeadline: string
  skills: CallSkillInput[]
}

export async function updateCall({ id, ...data }: UpdateCallParams) {
  return await fetcher(api.put<{ call: CallWithSkills }>(`api/v1/calls/${id}`, { json: data }).json(), {
    notFound: false,
  })
}