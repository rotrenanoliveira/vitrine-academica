import { getCachedInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import type { MyMembershipsFilters } from '../search-params'
import { MyMembershipsFilters as Filters } from './my-memberships-filters'
import { MyMembershipsTable } from './my-memberships-table'

type MyMembershipsListProps = {
  userId: string
  filters: MyMembershipsFilters
}

export async function MyMembershipsList({ userId, filters }: MyMembershipsListProps) {
  const [{ members }, { institutions }] = await Promise.all([
    getCachedMyInstitutionMemberships(userId),
    getCachedInstitutions(),
  ])

  const institutionsById = new Map(institutions.map((institution) => [institution.id, institution]))

  const rows = members
    .filter((member) => (filters.status ? member.status === filters.status : true))
    .map((member) => {
      const institution = institutionsById.get(member.institutionId)

      return {
        ...member,
        institution: institution ? { id: institution.id, slug: institution.slug, name: institution.name } : null,
      }
    })

  return (
    <div className="space-y-4">
      <Filters />
      <MyMembershipsTable data={rows} />
    </div>
  )
}
