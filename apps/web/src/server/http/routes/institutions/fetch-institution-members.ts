'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { InstitutionMember } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchInstitutionMembers(institutionId: string) {
  const [response, responseError] = await fetcher(
    api
      .get<{ members: InstitutionMember[] }>(`api/v1/institutions/${institutionId}/members`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedInstitutionMembers = cache(async (institutionId: string) => {
  return fetchInstitutionMembers(institutionId)
})
