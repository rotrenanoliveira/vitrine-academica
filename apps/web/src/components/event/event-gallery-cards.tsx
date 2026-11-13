import type { EventListItem } from '@/utils/type'
import { EventGalleryCard } from './event-gallery-card'

type EventGalleryCardsProps = {
  events: EventListItem[]
  title?: string
  eyebrow?: string
  description?: string
}

export function EventGalleryCards({
  events,
  title = 'Eventos',
  eyebrow,
  description = 'Ciclos temáticos em preparação, abertos e encerrados.',
}: EventGalleryCardsProps) {
  if (events.length === 0) {
    return null
  }

  const resolvedEyebrow = eyebrow ?? `galeria · ${String(events.length).padStart(2, '0')} eventos`
  const headingId = 'events-gallery-title'

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-[#252422]/55">{resolvedEyebrow}</p>
          <h2 id={headingId} className="font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="hidden max-w-xl text-right text-sm leading-relaxed text-[#252422]/65 md:block">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventGalleryCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
