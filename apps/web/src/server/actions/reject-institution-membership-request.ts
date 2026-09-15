'use server'

import { rejectInstitutionMembershipRequest } from '../http/routes/institutions/reject-institution-membership-request'
import { revalidateInstitutionMembershipRequests } from '../revalidate-institution-membership-requests'

export async function actionRejectInstitutionMembershipRequest(input: {
  institutionId: string
  institutionSlug: string
  requestId: string
}) {
  const [_, responseError] = await rejectInstitutionMembershipRequest({
    institutionId: input.institutionId,
    requestId: input.requestId,
  })

  if (responseError) {
    return {
      success: false,
      message: responseError.message ?? 'Não foi possível rejeitar a solicitação.',
    }
  }

  revalidateInstitutionMembershipRequests(input.institutionSlug)

  return { success: true, message: 'Solicitação rejeitada.' }
}
