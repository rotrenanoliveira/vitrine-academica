import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EventsSectionNav } from '../_components/events-section-nav'
import { PublicEventsListing } from '../_components/public-events-listing'
import { resolveCanCreateEvent } from '../_components/resolve-can-create-event'

export const metadata: Metadata = {
  title: 'Eventos em votação',
  description: 'Ciclos em escolha de tema ou seleção institucional',
}

export default async function EventsVotingPage() {
  const canCreateEvent = await resolveCanCreateEvent()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <EventsSectionNav canCreateEvent={canCreateEvent} />
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando eventos…</p>}>
          <PublicEventsListing
            phases={['THEME_SELECTION', 'INSTITUTIONAL_SELECTION']}
            emptyMessage="Nenhum evento em votação no momento."
          />
        </Suspense>
      </div>
    </div>
  )
}
