'use server'

import { fetcher } from '@/utils/fetcher'
import type { InstitutionMember, InstitutionMemberStatus } from '@/utils/type'
import { api } from '../../api-client'

type UpdateInstitutionMemberStatusParams = {
  institutionId: string
  memberId: string
  status: InstitutionMemberStatus
}

export async function updateInstitutionMemberStatus({
  institutionId,
  memberId,
  status,
}: UpdateInstitutionMemberStatusParams) {
  return await fetcher(
    api
      .post<{ member: InstitutionMember }>(`api/v1/institutions/${institutionId}/members/${memberId}/status`, {
        json: { status },
      })
      .json(),
  )
}
