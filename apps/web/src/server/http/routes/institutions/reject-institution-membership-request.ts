'use server'

import { fetcher } from '@/utils/fetcher'
import type { InstitutionMembershipRequest } from '@/utils/type'
import { api } from '../../api-client'

type RejectInstitutionMembershipRequestParams = {
  institutionId: string
  requestId: string
}

export async function rejectInstitutionMembershipRequest({
  institutionId,
  requestId,
}: RejectInstitutionMembershipRequestParams) {
  return await fetcher(
    api
      .post<{ request: InstitutionMembershipRequest }>(
        `api/v1/institutions/${institutionId}/membership-requests/${requestId}/reject`,
      )
      .json(),
  )
}
