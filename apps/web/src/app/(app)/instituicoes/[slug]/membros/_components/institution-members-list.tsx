'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchInstitutionMembers } from '@/server/http/routes/institutions/fetch-institution-members'
import { InstitutionMembersTable } from './institution-members-table'

type InstitutionMembersListProps = {
  institutionId: string
  institutionSlug: string
}

export function InstitutionMembersList({ institutionId, institutionSlug }: InstitutionMembersListProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['institution-members', institutionId],
    queryFn: () => fetchInstitutionMembers(institutionId),
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Carregando membros…</p>
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os membros.</p>
  }

  return <InstitutionMembersTable data={data.members} institutionId={institutionId} institutionSlug={institutionSlug} />
}
