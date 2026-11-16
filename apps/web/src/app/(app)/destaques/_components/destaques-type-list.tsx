'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { getCuration } from '@/server/http/routes/curation/get-curation'
import type { CurationScope } from '@/utils/curation-types'
import { destaquesSearchParams, destaquesUrlKeys } from '../search-params'
import { DestaquesProjectsGrid } from './destaques-projects-grid'
import { DestaquesProjectsGridSkeleton } from './destaques-projects-grid-skeleton'

type DestaquesTypeListProps = {
  type: Exclude<CurationScope, 'all'>
}

export function DestaquesTypeList({ type }: DestaquesTypeListProps) {
  const [filters] = useQueryStates(destaquesSearchParams, {
    urlKeys: destaquesUrlKeys,
    shallow: true,
  })

  const title = filters.title?.trim() || undefined
  const institutionIds =
    filters.institutionIds && filters.institutionIds.length > 0 ? filters.institutionIds : undefined
  const tagIds = filters.tags && filters.tags.length > 0 ? filters.tags : undefined
  const months = Number(filters.months)

  const {
    data,
    isPending: isCurationPending,
    isError: isCurationError,
  } = useQuery({
    queryKey: ['curation', { scope: type, title, institutionIds, tagIds, months }],
    queryFn: () =>
      getCuration({
        scope: type,
        months,
        ...(title ? { title } : {}),
        ...(institutionIds ? { institutionIds } : {}),
        ...(tagIds ? { tags: tagIds } : {}),
      }),
  })

  if (isCurationPending) {
    return <DestaquesProjectsGridSkeleton />
  }

  if (isCurationError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os destaques.</p>
  }

  return <DestaquesProjectsGrid projects={data.projects} />
}
