'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { InstitutionMembershipRequest } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchInstitutionMembershipRequests(institutionId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ requests: InstitutionMembershipRequest[] }>(`api/v1/institutions/${institutionId}/membership-requests`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedInstitutionMembershipRequests = cache(async (institutionId: string) => {
  return fetchInstitutionMembershipRequests(institutionId)
})
