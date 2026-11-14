'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { CallGalleryCard } from '@/components/call/call-gallery-card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCalls } from '@/server/http/routes/calls/fetch-calls'
import { callsSearchParams, callsUrlKeys } from '../search-params'

function CallsGallerySkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden bg-transparent p-0">
          <div className="flex min-h-56 flex-col bg-[#ebe6de] p-5">
            <Skeleton className="mb-3 h-3 w-20 rounded-none bg-[#252422]/15" />
            <Skeleton className="h-7 w-4/5 rounded-none bg-[#252422]/15" />
            <Skeleton className="mt-3 h-4 w-full rounded-none bg-[#252422]/10" />
            <Skeleton className="mt-2 h-4 w-5/6 rounded-none bg-[#252422]/10" />
            <Skeleton className="mt-4 h-5 w-24 rounded-none bg-[#252422]/10" />
            <Skeleton className="mt-auto h-5 w-36 rounded-none bg-[#252422]/15" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CallsGalleryList() {
  const [filters] = useQueryStates(callsSearchParams, {
    urlKeys: callsUrlKeys,
    shallow: true,
  })

  const tags = filters.tags && filters.tags.length > 0 ? filters.tags : undefined

  const { data, isPending, isError } = useQuery({
    queryKey: ['calls', { tags }],
    queryFn: () => fetchCalls({ ...(tags ? { tags } : {}) }),
  })

  if (isPending) {
    return <CallsGallerySkeleton />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os chamados.</p>
  }

  if (data.calls.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum chamado encontrado.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.calls.map((call) => (
        <CallGalleryCard key={call.id} call={call} />
      ))}
    </div>
  )
}
