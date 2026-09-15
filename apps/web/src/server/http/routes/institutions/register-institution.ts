'use server'

import { fetcher } from '@/utils/fetcher'
import type { Institution, InstitutionType } from '@/utils/type'
import { api } from '../../api-client'

type RegisterInstitutionParams = {
  name: string
  type: InstitutionType
  description: string
  shouldProof?: boolean
  shouldVerify?: boolean
  domain?: string
}

export async function registerInstitution(data: RegisterInstitutionParams) {
  return await fetcher(
    api
      .post<{ institution: Institution }>('api/v1/institutions', {
        json: data,
      })
      .json(),
  )
}
