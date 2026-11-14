import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { EventListItem, ParticipationScope } from '@/utils/type'
import { eventHref } from './event-utils'

const scopeLabels: Record<ParticipationScope, string> = {
  GLOBAL: 'Global',
  INSTITUTION: 'Institucional',
}

type EventGalleryCardProps = {
  event: EventListItem
}

export function EventGalleryCard({ event }: EventGalleryCardProps) {
  const href = eventHref(event)
  const title = event.name ?? event.slug
  const endsAt = new Date(event.endsAt).toLocaleDateString('pt-BR')

  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <Link href={href} className="block h-full" aria-label={`Abrir evento ${title}`}>
        <CardContent className="flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
          <p className="mb-3 line-clamp-1 text-[10px] uppercase tracking-[0.2em] text-[#252422]/55">
            {scopeLabels[event.participationScope]} · {event.institutionName}
          </p>
          <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em] group-hover:underline">
            {title}
          </h3>
          {event.winner ? (
            <p className="mt-3 line-clamp-2 text-sm text-[#252422]/70">Tema: {event.winner}</p>
          ) : (
            <p className="mt-3 line-clamp-2 text-sm text-[#252422]/55">Tema ainda não definido</p>
          )}
          <p className="mt-auto pt-5 text-sm text-[#252422]/55">Encerra em {endsAt}</p>
        </CardContent>
      </Link>
    </Card>
  )
}
