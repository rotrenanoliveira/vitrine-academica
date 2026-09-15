'use server'

import { cache } from 'react'
import { fetcher } from '@/utils/fetcher'
import type { Institution } from '@/utils/type'
import { api } from '../../api-client'

export async function getInstitution(id: string) {
  const [response, responseError] = await fetcher(
    api.get<{ institution: Institution }>(`api/v1/institutions/${id}`).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export async function getInstitutionBySlug(slug: string) {
  const [response, responseError] = await fetcher(
    api.get<{ institution: Institution }>(`api/v1/institutions/slug/${slug}`).json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}

export const getCachedInstitution = cache(async (id: string) => {
  return getInstitution(id)
})

export const getCachedInstitutionBySlug = cache(async (slug: string) => {
  return getInstitutionBySlug(slug)
})
