import type { Metadata } from 'next'
import { EventsSectionNav } from '../_components/events-section-nav'
import { PublicEventsListing } from '../_components/public-events-listing'

export const metadata: Metadata = {
  title: 'Eventos encerrados',
  description: 'Ciclos temáticos já encerrados da vitrine acadêmica',
}

export default async function EventsClosedPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <EventsSectionNav />
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <PublicEventsListing phases={['CLOSED']} emptyMessage="Nenhum evento encerrado ainda." />
      </div>
    </div>
  )
}
