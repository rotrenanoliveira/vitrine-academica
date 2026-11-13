'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { EventGalleryCard } from '@/components/event/event-gallery-card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchPublicEvents } from '@/server/http/routes/events/fetch-public-events'
import type { EventPhase } from '@/utils/type'
import { eventsSearchParams, eventsUrlKeys } from '../search-params'
import { EventsInstitutionFilters } from './events-institution-filters'
import { EventsPagination } from './events-pagination'

const PER_PAGE = 30

type PublicEventsListingProps = {
  phases: EventPhase[]
  emptyMessage: string
}

function PublicEventsListingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <Skeleton key={index} className="h-56 w-full rounded-none" />
      ))}
    </div>
  )
}

export function PublicEventsListing({ phases, emptyMessage }: PublicEventsListingProps) {
  const [filters] = useQueryStates(eventsSearchParams, {
    urlKeys: eventsUrlKeys,
    shallow: true,
  })

  const page = filters.page > 0 ? filters.page : 1
  const institutionIds =
    filters.institutionIds && filters.institutionIds.length > 0 ? filters.institutionIds : undefined

  const eventsQuery = useQuery({
    queryKey: ['public-events', { phases, page, institutionIds, perPage: PER_PAGE }],
    queryFn: () =>
      fetchPublicEvents({
        page,
        perPage: PER_PAGE,
        phase: phases,
        institutionIds,
      }),
  })

  return (
    <div className="flex flex-col gap-6">
      <EventsInstitutionFilters />

      {eventsQuery.isPending ? <PublicEventsListingSkeleton /> : null}

      {eventsQuery.isError ? (
        <p className="text-muted-foreground text-sm">Não foi possível carregar os eventos.</p>
      ) : null}

      {eventsQuery.isSuccess ? (
        eventsQuery.data.events.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {eventsQuery.data.events.map((event) => (
                <EventGalleryCard key={event.id} event={event} />
              ))}
            </div>
            <EventsPagination
              page={eventsQuery.data.page}
              hasNextPage={eventsQuery.data.page * eventsQuery.data.perPage < eventsQuery.data.total}
            />
          </div>
        )
      ) : null}
    </div>
  )
}
