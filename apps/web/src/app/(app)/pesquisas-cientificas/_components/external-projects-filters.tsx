'use client'

import { useQueryStates } from 'nuqs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { externalProjectsSearchParams, externalProjectsUrlKeys } from '../search-params'

export function ExternalProjectsFilters() {
  const [filters, setFilters] = useQueryStates(externalProjectsSearchParams, {
    urlKeys: externalProjectsUrlKeys,
    shallow: false,
  })

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="query">Buscar</Label>
        <Input
          id="query"
          type="search"
          placeholder="Busque por título, autores ou palavras-chave"
          className="min-w-80"
          value={filters.query ?? ''}
          onChange={(event) => {
            const value = event.target.value
            void setFilters({ query: value === '' ? null : value })
          }}
        />
      </div>
    </div>
  )
}
