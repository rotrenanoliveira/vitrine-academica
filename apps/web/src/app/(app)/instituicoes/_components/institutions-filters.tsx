'use client'

import { useQueryStates } from 'nuqs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { institutionsSearchParams, institutionsUrlKeys } from '../search-params'

export function InstitutionsFilters() {
  const [filters, setFilters] = useQueryStates(institutionsSearchParams, {
    urlKeys: institutionsUrlKeys,
    shallow: true,
  })

  const hasActiveFilters = Boolean(filters.query)

  function handleClear() {
    void setFilters({ query: null })
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-48 flex-col gap-2">
        <Label htmlFor="query">Buscar</Label>
        <Input
          id="query"
          type="search"
          placeholder="Buscar por nome"
          className="min-w-48 [&::-webkit-search-cancel-button]:hidden"
          value={filters.query ?? ''}
          onChange={(event) => {
            const value = event.target.value
            void setFilters({ query: value === '' ? null : value })
          }}
        />
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-col gap-2">
          <span className="invisible text-xs font-semibold tracking-wide uppercase" aria-hidden>
            Ações
          </span>
          <div className="flex h-10 items-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Limpar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
