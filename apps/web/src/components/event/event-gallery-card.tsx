import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Event } from '@/utils/type'
import { eventHref, phaseLabels } from './event-utils'

type EventGalleryCardProps = {
  event: Event
}

export function EventGalleryCard({ event }: EventGalleryCardProps) {
  const href = eventHref(event)
  const title = event.name ?? event.slug
  const dateRange = `De ${new Date(event.startsAt).toLocaleDateString('pt-BR')} até ${new Date(event.endsAt).toLocaleDateString('pt-BR')}`

  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <Link href={href} className="block h-full" aria-label={`Abrir evento ${title}`}>
        <CardContent className="flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
          <p className="mb-3 line-clamp-1 text-[10px] uppercase tracking-[0.2em] text-[#252422]/55">
            {phaseLabels[event.phase]}
          </p>
          <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em] group-hover:underline">
            {title}
          </h3>
          <p className="mt-auto pt-5 text-sm text-[#252422]/55">{dateRange}</p>
        </CardContent>
      </Link>
    </Card>
  )
}
