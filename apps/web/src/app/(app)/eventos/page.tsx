import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EventsSectionNav } from './_components/events-section-nav'
import { PublicEventsListing } from './_components/public-events-listing'

export const metadata: Metadata = {
  title: 'Eventos',
  description: 'Ciclos temáticos abertos da vitrine acadêmica',
}

export default async function EventsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <EventsSectionNav />
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando eventos…</p>}>
          <PublicEventsListing phases={['OPEN']} emptyMessage="Nenhum evento aberto no momento." />
        </Suspense>
      </div>
    </div>
  )
}
