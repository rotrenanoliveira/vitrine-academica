/** biome-ignore-all lint/style/noNonNullAssertion: eventId is always defined */
'use client'

import { useQuery } from '@tanstack/react-query'
import { AdminRegistrationQueue } from '@/components/event/admin-registration-queue'
import { AdminThemeModeration } from '@/components/event/admin-theme-moderation'
import { EditEventNameForm } from '@/components/event/edit-event-name-form'
import { NavBackPage } from '@/components/nav-back-page'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchEventRegistrations } from '@/server/http/routes/events/fetch-event-registrations'
import { getThemeSelection } from '@/server/http/routes/events/get-theme-selection'
import { getVoteCounter } from '@/server/http/routes/events/get-vote-counter'
import { getMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'
import type { Event } from '@/utils/type'

function EventEditSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-wrap items-start gap-3">
        <Skeleton className="size-14 rounded-none" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64 rounded-none" />
          <Skeleton className="h-4 w-80 rounded-none" />
        </div>
      </div>
      <Skeleton className="h-28 w-full max-w-lg rounded-none" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-56 w-full rounded-none bg-[#ebe6de]" />
        ))}
      </div>
    </div>
  )
}

function phaseHeadline(phase: Event['phase']) {
  switch (phase) {
    case 'THEME_SELECTION':
      return 'Votação aberta'
    case 'INSTITUTIONAL_SELECTION':
      return 'Aguardando decisão institucional'
    case 'OPEN':
      return 'Evento aberto'
    case 'CLOSED':
      return 'Evento encerrado'
  }
}

export function EventEdit({ slug, eventKey, userId }: { slug: string; eventKey: string; userId: string }) {
  const selectionQuery = useQuery({
    queryKey: ['event-theme-selection', eventKey],
    queryFn: () => getThemeSelection(eventKey),
  })

  const membershipsQuery = useQuery({
    queryKey: ['my-institution-memberships'],
    queryFn: () => getMyInstitutionMemberships(),
  })

  const eventId = selectionQuery.data?.event.id
  const eventSlug = selectionQuery.data?.event.slug ?? slug
  const phase = selectionQuery.data?.event.phase
  const showRegistrations = phase === 'OPEN' || phase === 'CLOSED'

  const voteCounterQuery = useQuery({
    queryKey: ['event-vote-counter', eventId],
    queryFn: () => getVoteCounter(eventId!),
    enabled: Boolean(eventId),
  })

  const registrationsQuery = useQuery({
    queryKey: ['event-registrations', eventId, 'PENDING'],
    queryFn: () => fetchEventRegistrations(eventId!, 'PENDING'),
    enabled: Boolean(eventId) && showRegistrations,
  })

  if (selectionQuery.isPending || membershipsQuery.isPending) {
    return <EventEditSkeleton />
  }

  if (selectionQuery.isError || !selectionQuery.data) {
    return <p className="text-muted-foreground text-sm">Não foi possível carregar o evento.</p>
  }

  const { event, themes } = selectionQuery.data
  const members = membershipsQuery.data?.members ?? []

  if (!canManageInstitution(members, event.institutionId, userId)) {
    return <p className="text-muted-foreground text-sm">Você não tem permissão para editar este evento.</p>
  }

  const counter = voteCounterQuery.data?.counter ?? []
  const pendingRegistrations = registrationsQuery.data?.registrations ?? []
  const pendingProjects = registrationsQuery.data?.projects ?? []

  return (
    <div className="flex flex-1 flex-col gap-12">
      <div className="flex flex-wrap items-start gap-3">
        <NavBackPage label="Voltar para eventos" />
        <div>
          <h1 className="text-2xl font-semibold">Editar ciclo</h1>
          <p className="text-muted-foreground text-sm">{phaseHeadline(event.phase)}</p>
        </div>
      </div>

      <EditEventNameForm
        key={`${event.id}-${event.name ?? ''}`}
        eventId={event.id}
        eventSlug={event.slug}
        initialName={event.name}
      />

      <section className="space-y-3">
        <h2 className="text-2xl font-medium">Temas</h2>
        {themes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum tema sugerido ainda.</p>
        ) : (
          <AdminThemeModeration event={event} themes={themes} counter={counter} />
        )}
      </section>

      {showRegistrations ? (
        <>
          <Separator />

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-medium">Fila de inscrições</h2>
              <p className="text-muted-foreground text-sm">
                Aprove ou rejeite projetos pendentes. Só os aprovados aparecem publicamente.
              </p>
            </div>
            {registrationsQuery.isPending ? (
              <p className="text-muted-foreground text-sm">Carregando inscrições…</p>
            ) : (
              <AdminRegistrationQueue
                eventId={event.id}
                eventSlug={eventSlug}
                registrations={pendingRegistrations}
                projects={pendingProjects}
              />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
