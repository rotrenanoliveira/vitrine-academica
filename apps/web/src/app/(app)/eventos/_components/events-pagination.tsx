'use client'

import { useQueryStates } from 'nuqs'
import { Button } from '@/components/ui/button'
import { eventsSearchParams, eventsUrlKeys } from '../search-params'

type EventsPaginationProps = {
  page: number
  hasNextPage: boolean
}

export function EventsPagination({ page, hasNextPage }: EventsPaginationProps) {
  const [, setFilters] = useQueryStates(eventsSearchParams, {
    urlKeys: eventsUrlKeys,
    shallow: true,
  })

  const hasPreviousPage = page > 1

  if (!hasPreviousPage && !hasNextPage) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={!hasPreviousPage}
        onClick={() => {
          void setFilters({ page: Math.max(1, page - 1) })
        }}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">Página {page}</span>
      <Button
        type="button"
        variant="outline"
        disabled={!hasNextPage}
        onClick={() => {
          void setFilters({ page: page + 1 })
        }}
      >
        Próxima
      </Button>
    </div>
  )
}
