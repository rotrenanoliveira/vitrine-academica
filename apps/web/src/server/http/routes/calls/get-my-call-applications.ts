'use server'

import type { CallApplicationWithCall } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function getMyCallApplications() {
  const [response, responseError] = await fetcher(
    api.get<{ applications: CallApplicationWithCall[] }>('api/v1/calls/me/applications', { cache: 'no-store' }).json(),
    { notFound: false },
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
