'use client'

import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { EventGalleryCard } from '@/components/event/event-gallery-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchInstitutionEvents } from '@/server/http/routes/events/fetch-institution-events'

type InstitutionEventsPreviewProps = {
  institutionId: string
  institutionSlug: string
}

export function InstitutionEventsPreview({ institutionId, institutionSlug }: InstitutionEventsPreviewProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['institution-events', institutionId],
    queryFn: () => fetchInstitutionEvents(institutionId),
  })

  const events = data?.events.slice(0, 3) ?? []

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Eventos</h2>
          <p className="text-muted-foreground text-sm">Ciclos temáticos criados por esta instituição.</p>
        </div>
        {!isPending && !isError && (data?.events.length ?? 0) > 0 ? (
          <Button
            nativeButton={false}
            size="icon"
            className="group size-14 shrink-0 rounded-none bg-[#252422] text-[#f4f1eb] shadow-none transition-[background-color,box-shadow] duration-200 hover:bg-[#252422]/85 hover:shadow-[6px_6px_0_rgba(37,36,34,0.18)] sm:w-16"
            render={<Link href={`/instituicoes/${institutionSlug}/eventos`} />}
            aria-label="Ver todos os eventos da instituição"
          >
            <span className="sr-only">Ver todos os eventos</span>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              className="size-5 transition-transform duration-200 group-hover:scale-125"
            />
          </Button>
        ) : null}
      </div>

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="min-h-56 rounded-none bg-[#ebe6de]" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-muted-foreground text-sm">Não foi possível carregar os eventos.</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum evento criado ainda.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventGalleryCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}
