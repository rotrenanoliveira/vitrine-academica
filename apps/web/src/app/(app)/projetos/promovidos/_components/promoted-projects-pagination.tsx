'use client'

import { useQueryStates } from 'nuqs'
import { Button } from '@/components/ui/button'
import { promotedProjectsSearchParams, promotedProjectsUrlKeys } from '../search-params'

type PromotedProjectsPaginationProps = {
  page: number
  hasNextPage: boolean
}

export function PromotedProjectsPagination({ page, hasNextPage }: PromotedProjectsPaginationProps) {
  const [, setFilters] = useQueryStates(promotedProjectsSearchParams, {
    urlKeys: promotedProjectsUrlKeys,
    shallow: false,
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
