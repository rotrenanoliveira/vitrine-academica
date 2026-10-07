'use server'

import { fetcher } from '@/utils/fetcher'
import type { Institution, InstitutionStatus } from '@/utils/type'
import { api } from '../../api-client'

type UpdateInstitutionStatusParams = {
  id: string
  status: InstitutionStatus
}

export async function updateInstitutionStatus({ id, status }: UpdateInstitutionStatusParams) {
  return await fetcher(
    api
      .post<{ institution: Institution }>(`api/v1/institutions/${id}/status`, {
        json: { status },
      })
      .json(),
  )
}
