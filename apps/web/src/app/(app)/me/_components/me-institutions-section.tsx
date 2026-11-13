'use client'

import { useQuery } from '@tanstack/react-query'
import { MembershipPreviewCard } from '@/components/institution/membership-preview-card'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { fetchInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { getMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'

const PREVIEW_LIMIT = 3

export function MeInstitutionsSection() {
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

  if (isPending) {
    return (
      <MeSection
        id="me-instituicoes"
        eyebrow="instituições"
        title="Minhas instituições"
        href="/me/instituicoes"
        linkLabel="Ver todas as minhas instituições"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError || !membershipsQuery.data || !institutionsQuery.data) {
    return (
      <MeSection
        id="me-instituicoes"
        eyebrow="instituições"
        title="Minhas instituições"
        href="/me/instituicoes"
        linkLabel="Ver todas as minhas instituições"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar as suas instituições.</p>
      </MeSection>
    )
  }

  const institutionsById = new Map(
    institutionsQuery.data.institutions.map((institution) => [institution.id, institution]),
  )
  const members = membershipsQuery.data.members
  const preview = members.slice(0, PREVIEW_LIMIT).map((member) => {
    const institution = institutionsById.get(member.institutionId)

    return {
      member,
      institution: institution ? { id: institution.id, slug: institution.slug, name: institution.name } : null,
    }
  })

  return (
    <MeSection
      id="me-instituicoes"
      eyebrow={`instituições · ${String(members.length).padStart(2, '0')}`}
      title="Minhas instituições"
      href="/me/instituicoes"
      linkLabel="Ver todas as minhas instituições"
      isEmpty={preview.length === 0}
      emptyMessage="Você ainda não faz parte de nenhuma instituição."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map(({ member, institution }) => (
          <MembershipPreviewCard key={member.id} member={member} institution={institution} />
        ))}
      </div>
    </MeSection>
  )
}
