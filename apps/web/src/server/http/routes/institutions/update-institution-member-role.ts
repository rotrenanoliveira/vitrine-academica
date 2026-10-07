'use server'

import { fetcher } from '@/utils/fetcher'
import type { InstitutionMember, InstitutionMemberRole } from '@/utils/type'
import { api } from '../../api-client'

type UpdateInstitutionMemberRoleParams = {
  institutionId: string
  memberId: string
  role: InstitutionMemberRole
}

export async function updateInstitutionMemberRole({
  institutionId,
  memberId,
  role,
}: UpdateInstitutionMemberRoleParams) {
  return await fetcher(
    api
      .post<{ member: InstitutionMember }>(`api/v1/institutions/${institutionId}/members/${memberId}/role`, {
        json: { role },
      })
      .json(),
  )
}
