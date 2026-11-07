'use server'

import type { CallWithSkills } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function getMyCalls() {
  const [response, responseError] = await fetcher(
    api.get<{ calls: CallWithSkills[] }>('api/v1/calls/me', { cache: 'no-store' }).json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}