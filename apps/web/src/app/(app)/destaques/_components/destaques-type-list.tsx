'use client'

import { useQuery } from '@tanstack/react-query'
import { getCuration } from '@/server/http/routes/curation/get-curation'
import type { CurationScope } from '@/utils/curation-types'
import { DestaquesProjectsGrid } from './destaques-projects-grid'
import { DestaquesProjectsGridSkeleton } from './destaques-projects-grid-skeleton'

type DestaquesTypeListProps = {
  type: Exclude<CurationScope, 'all'>
  title?: string | undefined
  institutionId?: string | undefined
  tagIds?: string[] | undefined
  months: number
}

export function DestaquesTypeList({ type, title, institutionId, tagIds, months }: DestaquesTypeListProps) {
  const {
    data,
    isPending: isCurationPending,
    isError: isCurationError,
  } = useQuery({
    queryKey: ['curation', { scope: type, title, institutionId, tagIds, months }],
    queryFn: () =>
      getCuration({
        scope: type,
        months,
        ...(title ? { title } : {}),
        ...(institutionId ? { institutionId } : {}),
        ...(tagIds && tagIds.length > 0 ? { tags: tagIds } : {}),
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
