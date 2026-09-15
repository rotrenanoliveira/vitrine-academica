import { getAttachment } from '@/server/http/routes/attachments/get-attachment'
import { getCachedInstitutionMembershipRequests } from '@/server/http/routes/institutions/fetch-institution-membership-requests'
import { getAssetsUrl } from '@/utils/assets'
import type { MembershipRequestsFilters } from '../search-params'
import { MembershipRequestsFilters as Filters } from './membership-requests-filters'
import { MembershipRequestsTable } from './membership-requests-table'

type MembershipRequestsListProps = {
  institutionId: string
  institutionSlug: string
  filters: MembershipRequestsFilters
}

export async function MembershipRequestsList({ institutionId, institutionSlug, filters }: MembershipRequestsListProps) {
  const { requests } = await getCachedInstitutionMembershipRequests(institutionId)

  const filtered = requests.filter((request) => request.status === filters.status)

  const data = await Promise.all(
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

  return (
    <div className="space-y-4">
      <Filters />
      <MembershipRequestsTable data={data} institutionId={institutionId} institutionSlug={institutionSlug} />
    </div>
  )
}
