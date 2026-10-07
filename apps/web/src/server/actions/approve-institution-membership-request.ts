'use server'

import { approveInstitutionMembershipRequest } from '../http/routes/institutions/approve-institution-membership-request'
import { revalidateInstitutionMembers } from '../revalidate-institution-members'
import { revalidateInstitutionMembershipRequests } from '../revalidate-institution-membership-requests'

export async function actionApproveInstitutionMembershipRequest(input: {
  institutionId: string
  institutionSlug: string
  requestId: string
}) {
  const [_, responseError] = await approveInstitutionMembershipRequest({
    institutionId: input.institutionId,
    requestId: input.requestId,
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível aprovar a solicitação.',
    }
  }

  revalidateInstitutionMembershipRequests(input.institutionSlug)
  revalidateInstitutionMembers(input.institutionSlug)

  return { success: true, message: 'Solicitação aprovada.' }
}
