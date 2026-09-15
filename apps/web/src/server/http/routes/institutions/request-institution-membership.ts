'use server'

import { fetcher } from '@/utils/fetcher'
import type { InstitutionMemberRole, InstitutionMembershipRequest } from '@/utils/type'
import { api } from '../../api-client'

type RequestInstitutionMembershipParams = {
  institutionId: string
  role: InstitutionMemberRole
  proofAttachmentId?: string
}

export async function requestInstitutionMembership({ institutionId, ...data }: RequestInstitutionMembershipParams) {
  return await fetcher(
    api
      .post<{ request: InstitutionMembershipRequest }>(`api/v1/institutions/${institutionId}/membership-requests`, {
        json: data,
      })
      .json(),
  )
}
