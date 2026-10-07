'use server'

import { fetcher } from '@/utils/fetcher'
import type { Institution } from '@/utils/type'
import { api } from '../../api-client'

type EditInstitutionParams = {
  id: string
  name: string
  description: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

export async function editInstitution({ id, ...data }: EditInstitutionParams) {
  return await fetcher(
    api
      .put<{ institution: Institution }>(`api/v1/institutions/${id}`, {
        json: data,
      })
      .json(),
  )
}
