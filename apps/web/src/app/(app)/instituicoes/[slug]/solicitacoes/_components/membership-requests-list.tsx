'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { getAttachment } from '@/server/http/routes/attachments/get-attachment'
import { fetchInstitutionMembershipRequests } from '@/server/http/routes/institutions/fetch-institution-membership-requests'
import { getAssetsUrl } from '@/utils/assets'
import { membershipRequestsSearchParams, membershipRequestsUrlKeys } from '../search-params'
import { MembershipRequestsFilters as Filters } from './membership-requests-filters'
import { MembershipRequestsTable } from './membership-requests-table'

type MembershipRequestsListProps = {
  institutionId: string
  institutionSlug: string
}

export function MembershipRequestsList({ institutionId, institutionSlug }: MembershipRequestsListProps) {
  const [filters] = useQueryStates(membershipRequestsSearchParams, {
    urlKeys: membershipRequestsUrlKeys,
    shallow: true,
  })

  const { data, isPending, isError } = useQuery({
    queryKey: ['institution-membership-requests', institutionId, { status: filters.status }],
    queryFn: async () => {
      const { requests } = await fetchInstitutionMembershipRequests(institutionId)
      const filtered = requests.filter((request) => request.status === filters.status)

      return Promise.all(
        filtered.map(async (request) => {
          if (!request.proofAttachmentId) {
            return { ...request, proofUrl: null }
          }

          const [attachmentResult] = await getAttachment(request.proofAttachmentId)

          if (!attachmentResult) {
            return { ...request, proofUrl: null }
          }

          return {
            ...request,
            proofUrl: getAssetsUrl(attachmentResult.attachment.storageKey),
          }
        }),
      )
    },
  })

  return (
    <div className="space-y-4">
      <Filters />
      {isPending ? (
        <p className="text-sm text-muted-foreground">Carregando solicitações…</p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Não foi possível carregar as solicitações.</p>
      ) : (
        <MembershipRequestsTable data={data} institutionId={institutionId} institutionSlug={institutionSlug} />
      )}
    </div>
  )
}
