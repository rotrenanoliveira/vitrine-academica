'use server'

import type { CallApplicationWithApplicant } from '@/utils/call-type'
import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

export async function getCallApplications(callId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ applications: CallApplicationWithApplicant[] }>(`api/v1/calls/${callId}/applications`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}