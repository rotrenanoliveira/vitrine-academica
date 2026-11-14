'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { fetchInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { getMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { myMembershipsSearchParams, myMembershipsUrlKeys } from '../search-params'
import { MyMembershipsFilters as Filters } from './my-memberships-filters'
import { MyMembershipsTable } from './my-memberships-table'

export function MyMembershipsList() {
  const [filters] = useQueryStates(myMembershipsSearchParams, {
    urlKeys: myMembershipsUrlKeys,
    shallow: true,
  })

  const membershipsQuery = useQuery({
    queryKey: ['my-institution-memberships'],
    queryFn: () => getMyInstitutionMemberships(),
  })

  const institutionsQuery = useQuery({
    queryKey: ['institutions'],
    queryFn: () => fetchInstitutions(),
  })

  const isPending = membershipsQuery.isPending || institutionsQuery.isPending
  const isError = membershipsQuery.isError || institutionsQuery.isError

  const rows =
    membershipsQuery.data && institutionsQuery.data
      ? (() => {
          const institutionsById = new Map(
            institutionsQuery.data.institutions.map((institution) => [institution.id, institution]),
          )

          return membershipsQuery.data.members
            .filter((member) => (filters.status ? member.status === filters.status : true))
            .map((member) => {
              const institution = institutionsById.get(member.institutionId)

              return {
                ...member,
                institution: institution
                  ? { id: institution.id, slug: institution.slug, name: institution.name }
                  : null,
              }
            })
        })()
      : []

  return (
    <div className="space-y-4">
      <Filters />
      {isPending ? (
        <p className="text-sm text-muted-foreground">Carregando membresias…</p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Não foi possível carregar as membresias.</p>
      ) : (
        <MyMembershipsTable data={rows} />
      )}
    </div>
  )
}
