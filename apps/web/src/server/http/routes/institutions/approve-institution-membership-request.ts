'use server'

import { fetcher } from '@/utils/fetcher'
import type { InstitutionMember, InstitutionMembershipRequest } from '@/utils/type'
import { api } from '../../api-client'

type ApproveInstitutionMembershipRequestParams = {
  institutionId: string
  requestId: string
}

export async function approveInstitutionMembershipRequest({
  institutionId,
  requestId,
}: ApproveInstitutionMembershipRequestParams) {
  return await fetcher(
    api
      .post<{ request: InstitutionMembershipRequest; member: InstitutionMember }>(
        `api/v1/institutions/${institutionId}/membership-requests/${requestId}/approve`,
      )
      .json(),
  )
}
