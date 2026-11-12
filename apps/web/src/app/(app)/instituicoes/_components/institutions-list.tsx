'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { institutionsSearchParams, institutionsUrlKeys } from '../search-params'
import { InstitutionsGallery } from './institutions-gallery'

function InstitutionsListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: just for skeleton
        <div key={index} className="overflow-hidden bg-transparent p-0">
          <div className="p-2">
            <div className="border border-[#252422]/30 bg-[#e6e0d7] p-2 shadow-[5px_5px_0_rgba(37,36,34,0.08)]">
              <Skeleton className="relative aspect-4/3 rounded-none bg-[#c6c0b8]" />
            </div>
          </div>
          <div className="flex min-h-40 flex-col bg-[#ebe6de] p-5">
            <Skeleton className="h-7 w-4/5 rounded-none bg-[#252422]/15" />
            <Skeleton className="mt-3 h-4 w-full rounded-none bg-[#252422]/10" />
            <Skeleton className="mt-2 h-4 w-5/6 rounded-none bg-[#252422]/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InstitutionsList() {
  const [filters] = useQueryStates(institutionsSearchParams, {
    urlKeys: institutionsUrlKeys,
    shallow: true,
  })

  const { data, isPending, isError } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => fetchInstitutions(),
  })

  if (isPending) {
    return <InstitutionsListSkeleton />
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar as instituições.</p>
  }

  const query = filters.query?.trim().toLowerCase()

  const filtered = data.institutions.filter((institution) => {
    if (!query) return true
    return institution.name.toLowerCase().includes(query) || institution.slug.toLowerCase().includes(query)
  })

  return <InstitutionsGallery institutions={filtered} />
}
