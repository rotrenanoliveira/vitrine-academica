'use client'

import { useQueryStates } from 'nuqs'
import { Label } from '@/components/ui/label'
import { projectsSearchParams, projectsUrlKeys } from '../search-params'

const statusLabels: Record<string, string> = {
  SKETCH: 'Rascunho',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
}

export function ProjectsFilters() {
  const [filters, setFilters] = useQueryStates(projectsSearchParams, {
    urlKeys: projectsUrlKeys,
    shallow: false,
  })

  return (
    <div className="flex items-end gap-3">
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
