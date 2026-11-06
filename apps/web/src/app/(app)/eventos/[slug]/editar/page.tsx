import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminRegistrationQueue } from '@/components/event/admin-registration-queue'
import { AdminThemeModeration } from '@/components/event/admin-theme-moderation'
import { EditEventNameForm } from '@/components/event/edit-event-name-form'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { requireUser } from '@/server/auth/require-user'
import { getCachedEventRegistrations } from '@/server/http/routes/events/fetch-event-registrations'
import { getCachedThemeSelection } from '@/server/http/routes/events/get-theme-selection'
import { getCachedVoteCounter } from '@/server/http/routes/events/get-vote-counter'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'
import type { Event, EventRegistration, EventTheme, Project } from '@/utils/type'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ eventId?: string }>
}

export const metadata: Metadata = {
  title: 'Editar evento',
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

export default async function EventEditPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { eventId: eventIdParam } = await searchParams
  const user = await requireUser()
  const eventKey = eventIdParam ?? slug

  let selection: { event: Event; themes: EventTheme[] }
  try {
    selection = await getCachedThemeSelection(eventKey, user.id)
  } catch {
    notFound()
  }

  const { event, themes } = selection
  const { members } = await getCachedMyInstitutionMemberships(user.id)

  if (!canManageInstitution(members, event.institutionId, user.id)) {
    notFound()
  }

  let counter: { themeId: string; votes: number }[] = []
  try {
    ;({ counter } = await getCachedVoteCounter(event.id, user.id))
  } catch {
    counter = []
  }

  let pendingRegistrations: EventRegistration[] = []
  let pendingProjects: Project[] = []
  if (event.phase === 'OPEN' || event.phase === 'CLOSED') {
    try {
      const payload = await getCachedEventRegistrations(event.id, user.id, 'PENDING')
      pendingRegistrations = payload.registrations
      pendingProjects = payload.projects
    } catch {
      pendingRegistrations = []
      pendingProjects = []
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/eventos" />}>Eventos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Editar · {event.name ?? event.slug}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Editar ciclo</h1>
          <p className="text-muted-foreground text-sm">{phaseHeadline(event.phase)}</p>
          <p className="text-muted-foreground text-sm">
            Link da escolha:{' '}
            <Link className="underline" href={`/eventos/${event.slug}/escolha`}>
              /eventos/{event.slug}/escolha
            </Link>
          </p>
        </div>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Título</h2>
          <EditEventNameForm eventId={event.id} eventSlug={event.slug} initialName={event.name} />
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Temas</h2>
          {themes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum tema sugerido ainda.</p>
          ) : (
            <AdminThemeModeration event={event} themes={themes} counter={counter} />
          )}
        </section>

        {(event.phase === 'OPEN' || event.phase === 'CLOSED') && (
          <>
            <Separator />
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-medium">Fila de inscrições</h2>
                <p className="text-muted-foreground text-sm">
                  Aprove ou rejeite projetos pendentes. Só os aprovados aparecem publicamente.
                </p>
              </div>
              <AdminRegistrationQueue
                eventSlug={event.slug}
                registrations={pendingRegistrations}
                projects={pendingProjects}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
