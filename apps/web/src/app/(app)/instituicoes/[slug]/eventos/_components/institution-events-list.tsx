'use client'

import { useQuery } from '@tanstack/react-query'
import { EventGalleryCards } from '@/components/event/event-gallery-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchInstitutionEvents } from '@/server/http/routes/events/fetch-institution-events'

type InstitutionEventsListProps = {
  institutionId: string
  institutionName: string
}

function InstitutionEventsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: just for skeleton
        <Skeleton key={index} className="min-h-56 rounded-none bg-[#ebe6de]" />
      ))}
    </div>
  )
}

export function InstitutionEventsList({ institutionId, institutionName }: InstitutionEventsListProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['institution-events', institutionId],
    queryFn: () => fetchInstitutionEvents(institutionId),
  })

  if (isPending) {
    return <InstitutionEventsSkeleton />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os eventos.</p>
  }

  if (data.events.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento criado ainda.</p>
  }

  return (
    <EventGalleryCards events={data.events} title="Eventos" description={`Ciclos temáticos de ${institutionName}.`} />
  )
}
