'use server'

import type { CallWithSkills } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function getCall(id: string) {
  const [response, responseError] = await fetcher(
    api.get<{ call: CallWithSkills }>(`api/v1/calls/${id}`, { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
