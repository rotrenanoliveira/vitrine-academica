'use client'

import { useQuery } from '@tanstack/react-query'
import { CallPreviewCard } from '@/components/call/call-preview-card'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { getMyCalls } from '@/server/http/routes/calls/get-my-calls'

const PREVIEW_LIMIT = 3

export function MeCallsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'calls'],
    queryFn: () => getMyCalls(),
  })

  if (isPending) {
    return (
      <MeSection
        id="me-chamados"
        eyebrow="chamados"
        title="Meus chamados"
        href="/me/chamados"
        linkLabel="Ver todos os meus chamados"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError) {
    return (
      <MeSection
        id="me-chamados"
        eyebrow="chamados"
        title="Meus chamados"
        href="/me/chamados"
        linkLabel="Ver todos os meus chamados"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar os seus chamados.</p>
      </MeSection>
    )
  }

  const preview = data.calls.slice(0, PREVIEW_LIMIT)

  return (
    <MeSection
      id="me-chamados"
      eyebrow={`chamados · ${String(data.calls.length).padStart(2, '0')}`}
      title="Meus chamados"
      href="/me/chamados"
      linkLabel="Ver todos os meus chamados"
      isEmpty={preview.length === 0}
      emptyMessage="Você ainda não publicou chamados."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((call) => (
          <CallPreviewCard key={call.id} call={call} />
        ))}
      </div>
    </MeSection>
  )
}
