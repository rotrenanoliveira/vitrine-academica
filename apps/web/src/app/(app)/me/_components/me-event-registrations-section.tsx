'use client'

import { useQuery } from '@tanstack/react-query'
import { EventRegistrationPreviewCard } from '@/components/event/event-registration-preview-card'
import { MeCardsSkeleton } from '@/components/me/me-cards-skeleton'
import { MeSection } from '@/components/me/me-section'
import { getMyEventRegistrations } from '@/server/http/routes/events/get-my-event-registrations'

const PREVIEW_LIMIT = 3

export function MeEventRegistrationsSection() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'event-registrations'],
    queryFn: () => getMyEventRegistrations(),
  })

  if (isPending) {
    return (
      <MeSection
        id="me-inscricoes"
        eyebrow="inscrições"
        title="Minhas inscrições"
        href="/me/inscricoes"
        linkLabel="Ver todas as minhas inscrições"
      >
        <MeCardsSkeleton />
      </MeSection>
    )
  }

  if (isError) {
    return (
      <MeSection
        id="me-inscricoes"
        eyebrow="inscrições"
        title="Minhas inscrições"
        href="/me/inscricoes"
        linkLabel="Ver todas as minhas inscrições"
      >
        <p className="text-sm text-muted-foreground">Não foi possível carregar as suas inscrições.</p>
      </MeSection>
    )
  }

  const preview = data.registrations.slice(0, PREVIEW_LIMIT)

  return (
    <MeSection
      id="me-inscricoes"
      eyebrow={`inscrições · ${String(data.registrations.length).padStart(2, '0')}`}
      title="Minhas inscrições"
      href="/me/inscricoes"
      linkLabel="Ver todas as minhas inscrições"
      isEmpty={preview.length === 0}
      emptyMessage="Você ainda não inscreveu nenhum projeto em um evento."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((registration) => (
          <EventRegistrationPreviewCard key={registration.id} registration={registration} />
        ))}
      </div>
    </MeSection>
  )
}
