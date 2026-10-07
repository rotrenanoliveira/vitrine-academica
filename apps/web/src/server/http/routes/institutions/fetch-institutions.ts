'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Institution } from '@/utils/type'
import { api } from '../../api-client'

export async function fetchInstitutions() {
  const [response, responseError] = await fetcher(
    api.get<{ institutions: Institution[] }>('api/v1/institutions', { cache: 'no-store' }).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

/** Request-scoped memoization — padrão do repo (ver get-my-projects). */
export const getCachedInstitutions = cache(async () => {
  return fetchInstitutions()
})
