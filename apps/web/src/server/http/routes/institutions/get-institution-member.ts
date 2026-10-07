'use server'

import { fetcher } from '@/utils/fetcher'
import type { InstitutionMember } from '@/utils/type'
import { api } from '../../api-client'

type GetInstitutionMemberParams = {
  institutionId: string
  memberId: string
}

export async function getInstitutionMember({ institutionId, memberId }: GetInstitutionMemberParams) {
  const [response, responseError] = await fetcher(
    api
      .get<{ member: InstitutionMember }>(`api/v1/institutions/${institutionId}/members/${memberId}`, {
        cache: 'no-store',
      })
      .json(),
  )

  if (responseError) throw new Error(responseError.message)

  return response
}
