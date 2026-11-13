'use client'

import { useQuery } from '@tanstack/react-query'
import { ApplicationPreviewCard } from '@/components/call/application-preview-card'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { getMyCallApplications } from '@/server/http/routes/calls/get-my-call-applications'

const PREVIEW_LIMIT = 3

export function MeApplicationsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'applications'],
    queryFn: () => getMyCallApplications(),
  })

  if (isPending) {
    return (
      <MeSection
        id="me-candidaturas"
        eyebrow="candidaturas"
        title="Minhas candidaturas"
        href="/me/candidaturas"
        linkLabel="Ver todas as minhas candidaturas"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError) {
    return (
      <MeSection
        id="me-candidaturas"
        eyebrow="candidaturas"
        title="Minhas candidaturas"
        href="/me/candidaturas"
        linkLabel="Ver todas as minhas candidaturas"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar as suas candidaturas.</p>
      </MeSection>
    )
  }

  const preview = data.applications.slice(0, PREVIEW_LIMIT)

  return (
    <MeSection
      id="me-candidaturas"
      eyebrow={`candidaturas · ${String(data.applications.length).padStart(2, '0')}`}
      title="Minhas candidaturas"
      href="/me/candidaturas"
      linkLabel="Ver todas as minhas candidaturas"
      isEmpty={preview.length === 0}
      emptyMessage="Você ainda não se candidatou a nenhum chamado."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((application) => (
          <ApplicationPreviewCard key={application.id} application={application} />
        ))}
      </div>
    </MeSection>
  )
}
