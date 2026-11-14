'use client'

import { useQuery } from '@tanstack/react-query'
import { FormRequestInstitutionMembership } from '@/components/institution/form-request-institution-membership'
import { fetchInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { getMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { isActiveInstitutionMember } from '@/utils/can-manage-institution'

type RequestMembershipPickerProps = {
  userId: string
}

export function RequestMembershipPicker({ userId }: RequestMembershipPickerProps) {
  const institutionsQuery = useQuery({
    queryKey: ['institutions'],
    queryFn: () => fetchInstitutions(),
  })

  const membershipsQuery = useQuery({
    queryKey: ['my-institution-memberships'],
    queryFn: () => getMyInstitutionMemberships(),
  })

  if (institutionsQuery.isPending || membershipsQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Carregando instituições…</p>
  }

  if (institutionsQuery.isError || membershipsQuery.isError || !institutionsQuery.data || !membershipsQuery.data) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar as instituições disponíveis.</p>
  }

  const eligibleInstitutions = institutionsQuery.data.institutions
    .filter(
      (institution) =>
        institution.status === 'ACTIVE' &&
        !isActiveInstitutionMember(membershipsQuery.data.members, institution.id, userId),
    )
    .map((institution) => ({
      id: institution.id,
      slug: institution.slug,
      name: institution.name,
      shouldProof: institution.shouldProof,
    }))

  return <FormRequestInstitutionMembership variant="picker" institutions={eligibleInstitutions} />
}
