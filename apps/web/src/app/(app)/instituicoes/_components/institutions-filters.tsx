'use client'

import { useQueryStates } from 'nuqs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { institutionsSearchParams, institutionsUrlKeys } from '../search-params'

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
  ARCHIVED: 'Arquivada',
}

export function InstitutionsFilters() {
  const [filters, setFilters] = useQueryStates(institutionsSearchParams, {
    urlKeys: institutionsUrlKeys,
    shallow: false,
  })

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="query">Buscar</Label>
        <Input
          id="query"
          type="search"
          placeholder="Nome ou slug"
          className="min-w-48"
          value={filters.query ?? ''}
          onChange={(event) => {
            const value = event.target.value
            void setFilters({ query: value === '' ? null : value })
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="border-input bg-background h-9 min-w-48 border-b px-0 text-sm outline-none"
          value={filters.status ?? ''}
          onChange={(event) => {
            const value = event.target.value
            void setFilters({
              status: value === '' ? null : (value as typeof filters.status),
            })
          }}
        >
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
