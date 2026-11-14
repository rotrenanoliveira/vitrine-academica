'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { fetchInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { eventsSearchParams, eventsUrlKeys } from '../search-params'

type InstitutionFilterOption = {
  id: string
  name: string
}

const ALL_OPTION: InstitutionFilterOption = { id: 'all', name: 'Global' }
const EMPTY_SELECTION: InstitutionFilterOption[] = []

function sameIds(left: { id: string }[], right: { id: string }[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id)
}

export function EventsInstitutionFilters() {
  const institutionsAnchor = useComboboxAnchor()
  const [filters, setFilters] = useQueryStates(eventsSearchParams, {
    urlKeys: eventsUrlKeys,
    shallow: true,
  })
  const [selectedInstitutions, setSelectedInstitutions] = useState<InstitutionFilterOption[]>(EMPTY_SELECTION)

  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => fetchInstitutions(),
  })

  const institutions = useMemo<InstitutionFilterOption[]>(
    () =>
      (institutionsData?.institutions ?? []).map((institution) => ({
        id: institution.id,
        name: institution.name,
      })),
    [institutionsData?.institutions],
  )

  const items = useMemo(() => [ALL_OPTION, ...institutions], [institutions])
  const institutionIdsKey = filters.institutionIds?.join(',') ?? ''

  useEffect(() => {
    if (!institutionIdsKey) {
      setSelectedInstitutions((previous) => (previous.length === 0 ? previous : EMPTY_SELECTION))
      return
    }

    const selectedIds = new Set(institutionIdsKey.split(','))
    const next = institutions.filter((institution) => selectedIds.has(institution.id))

    setSelectedInstitutions((previous) => (sameIds(previous, next) ? previous : next))
  }, [institutionIdsKey, institutions])

  function handleInstitutionsChange(value: InstitutionFilterOption[]) {
    const withoutAll = value.filter((item) => item.id !== ALL_OPTION.id)
    const includesAll = value.some((item) => item.id === ALL_OPTION.id)

    // Clicou em "Todas" com instituições já selecionadas → volta ao escopo global.
    if (includesAll && selectedInstitutions.length > 0 && withoutAll.length === selectedInstitutions.length) {
      setSelectedInstitutions(EMPTY_SELECTION)
      void setFilters({ institutionIds: null, page: 1 })
      return
    }

    if (withoutAll.length === 0) {
      setSelectedInstitutions(EMPTY_SELECTION)
      void setFilters({ institutionIds: null, page: 1 })
      return
    }

    const next = sameIds(selectedInstitutions, withoutAll) ? selectedInstitutions : withoutAll
    setSelectedInstitutions(next)
    void setFilters({
      institutionIds: next.map((institution) => institution.id),
      page: 1,
    })
  }

  function handleClear() {
    setSelectedInstitutions(EMPTY_SELECTION)
    void setFilters({ institutionIds: null, page: 1 })
  }

  const hasActiveFilters = Boolean(filters.institutionIds && filters.institutionIds.length > 0)
  const displayValue = selectedInstitutions.length > 0 ? selectedInstitutions : [ALL_OPTION]

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-56 flex-col gap-2">
        <Label>Escopo</Label>
        <Combobox
          multiple
          items={items}
          value={displayValue}
          onValueChange={handleInstitutionsChange}
          itemToStringLabel={(institution) => institution.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <ComboboxChips ref={institutionsAnchor} className="h-10 min-h-10 w-full min-w-56 py-0">
            {selectedInstitutions.length > 2 ? (
              <span className="flex h-[calc(--spacing(5.5))] items-center bg-muted px-2 text-xs font-medium text-foreground">
                {selectedInstitutions.length} selecionados
              </span>
            ) : selectedInstitutions.length > 0 ? (
              selectedInstitutions.map((institution) => (
                <ComboboxChip key={institution.id}>{institution.name}</ComboboxChip>
              ))
            ) : (
              <ComboboxChip>{ALL_OPTION.name}</ComboboxChip>
            )}
            <ComboboxChipsInput placeholder="Buscar instituições..." />
          </ComboboxChips>
          <ComboboxContent anchor={institutionsAnchor}>
            <ComboboxEmpty>Nenhuma instituição encontrada.</ComboboxEmpty>
            <ComboboxList>
              {(institution: InstitutionFilterOption) => (
                <ComboboxItem key={institution.id} value={institution}>
                  {institution.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
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
