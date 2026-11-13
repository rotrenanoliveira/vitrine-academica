'use client'

import { useQueryStates } from 'nuqs'
import { Button } from '@/components/ui/button'
import { institutionProjectsSearchParams, institutionProjectsUrlKeys } from '../search-params'

type InstitutionProjectsPaginationProps = {
  page: number
  hasNextPage: boolean
}

export function InstitutionProjectsPagination({ page, hasNextPage }: InstitutionProjectsPaginationProps) {
  const [, setFilters] = useQueryStates(institutionProjectsSearchParams, {
    urlKeys: institutionProjectsUrlKeys,
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
