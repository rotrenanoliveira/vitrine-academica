'use server'

import type { CallSkillInput, CallWithSkills } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type RegisterCallParams = {
  title: string
  description: string
  applicationDeadline: string
  skills: CallSkillInput[]
}

export async function registerCall(data: RegisterCallParams) {
  return await fetcher(api.post<{ call: CallWithSkills }>('api/v1/calls', { json: data }).json(), {
    notFound: false,
  })
}