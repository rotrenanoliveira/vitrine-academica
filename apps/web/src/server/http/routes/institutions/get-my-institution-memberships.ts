'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { InstitutionMember } from '@/utils/type'
import { api } from '../../api-client'

export async function getMyInstitutionMemberships() {
  const [response, responseError] = await fetcher(
    api.get<{ members: InstitutionMember[] }>('api/v1/institutions/me', { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

/** Request-scoped memoization (cookies/auth safe). */
export const getCachedMyInstitutionMemberships = cache(async (userId: string) => {
  void userId
  return getMyInstitutionMemberships()
})
