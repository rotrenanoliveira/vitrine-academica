'use client'

import { useQueryStates } from 'nuqs'
import { Label } from '@/components/ui/label'
import { membershipRequestsSearchParams, membershipRequestsUrlKeys } from '../search-params'

const statusLabels = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
} as const

export function MembershipRequestsFilters() {
  const [filters, setFilters] = useQueryStates(membershipRequestsSearchParams, {
    urlKeys: membershipRequestsUrlKeys,
    shallow: false,
  })

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="border-input bg-background h-9 min-w-48 border-b px-0 text-sm outline-none"
          value={filters.status}
          onChange={(event) => {
            void setFilters({
              status: event.target.value as typeof filters.status,
            })
          }}
        >
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
