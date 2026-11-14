'use client'

import { useQuery } from '@tanstack/react-query'
import { getCuration } from '@/server/http/routes/curation/get-curation'
import { DestaquesProjectsGrid } from './destaques-projects-grid'
import { DestaquesProjectsGridSkeleton } from './destaques-projects-grid-skeleton'

const DEFAULT_MONTHS = 3
const OVERVIEW_LIMIT = 10

export function DestaquesOverviewList() {
  const {
    data,
    isPending: isCurationPending,
    isError: isCurationError,
  } = useQuery({
    queryKey: ['curation', { months: DEFAULT_MONTHS, limit: OVERVIEW_LIMIT, scope: 'all' }],
    queryFn: () => getCuration({ months: DEFAULT_MONTHS, limit: OVERVIEW_LIMIT, scope: 'all' }),
  })

  if (isCurationPending) {
    return <DestaquesProjectsGridSkeleton count={10} />
  }

  if (isCurationError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os destaques.</p>
  }

  return <DestaquesProjectsGrid projects={data.projects} />
}
