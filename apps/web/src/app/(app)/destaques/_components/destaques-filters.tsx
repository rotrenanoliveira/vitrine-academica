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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'
import type { Institution, Tag } from '@/utils/type'
import { destaquesSearchParams, destaquesUrlKeys } from '../search-params'

const periodOptions = [
  { value: '1', label: 'Último mês' },
  { value: '3', label: 'Últimos 3 meses' },
  { value: '6', label: 'Últimos 6 meses' },
  { value: '12', label: 'Último ano' },
] as const

const selectClassName = 'border-input bg-background h-10 min-w-48 border-b px-0 text-sm outline-none'

const EMPTY_TAGS: Tag[] = []
const EMPTY_INSTITUTIONS: Institution[] = []

function sameIds(left: { id: string }[], right: { id: string }[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id)
}

export function DestaquesFilters() {
  const institutionsAnchor = useComboboxAnchor()
  const tagsAnchor = useComboboxAnchor()
  const [filters, setFilters] = useQueryStates(destaquesSearchParams, {
    urlKeys: destaquesUrlKeys,
    shallow: true,
  })
  const [selectedInstitutions, setSelectedInstitutions] = useState<Institution[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => fetchInstitutions(),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchTags(),
  })

  const activeInstitutions = useMemo(
    () => institutionsData?.institutions.filter((institution) => institution.status === 'ACTIVE') ?? EMPTY_INSTITUTIONS,
    [institutionsData],
  )

  const tags = tagsData?.tags ?? EMPTY_TAGS
  const institutionIdsKey = filters.institutionIds?.join(',') ?? ''
  const tagIdsKey = filters.tags?.join(',') ?? ''

  useEffect(() => {
    if (!institutionIdsKey) {
      setSelectedInstitutions((previous) => (previous.length === 0 ? previous : EMPTY_INSTITUTIONS))
      return
    }

    const selectedIds = new Set(institutionIdsKey.split(','))
    const next = activeInstitutions.filter((institution) => selectedIds.has(institution.id))

    setSelectedInstitutions((previous) => (sameIds(previous, next) ? previous : next))
  }, [activeInstitutions, institutionIdsKey])

  useEffect(() => {
    if (!tagIdsKey) {
      setSelectedTags((previous) => (previous.length === 0 ? previous : EMPTY_TAGS))
      return
    }

    const selectedIds = new Set(tagIdsKey.split(','))
    const next = tags.filter((tag) => selectedIds.has(tag.id))

    setSelectedTags((previous) => (sameIds(previous, next) ? previous : next))
  }, [tagIdsKey, tags])

  function handleTitleChange(value: string) {
    void setFilters({ title: value === '' ? null : value })
  }

  function handleInstitutionsChange(value: Institution[]) {
    const next = sameIds(selectedInstitutions, value) ? selectedInstitutions : value
    setSelectedInstitutions(next)
    void setFilters({ institutionIds: next.length > 0 ? next.map((institution) => institution.id) : null })
  }

  function handleTagsChange(value: Tag[]) {
    const next = sameIds(selectedTags, value) ? selectedTags : value
    setSelectedTags(next)
    void setFilters({ tags: next.length > 0 ? next.map((tag) => tag.id) : null })
  }

  function handleMonthsChange(value: string) {
    const months = periodOptions.find((option) => option.value === value)?.value ?? null
    void setFilters({ months })
  }

  function handleClear() {
    setSelectedInstitutions(EMPTY_INSTITUTIONS)
    setSelectedTags(EMPTY_TAGS)
    void setFilters({ title: null, institutionIds: null, tags: null, months: null })
  }

  const hasActiveFilters = Boolean(
    filters.title ||
      (filters.institutionIds && filters.institutionIds.length > 0) ||
      (filters.tags && filters.tags.length > 0) ||
      filters.months !== '3',
  )

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-48 flex-1 flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          value={filters.title ?? ''}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Buscar por título"
        />
      </div>

      <div className="flex min-w-56 flex-col gap-2">
        <Label>Instituição</Label>
        <Combobox
          multiple
          items={activeInstitutions}
          value={selectedInstitutions}
          onValueChange={handleInstitutionsChange}
          itemToStringLabel={(institution) => institution.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <ComboboxChips ref={institutionsAnchor} className="h-10 min-h-10 w-full min-w-56 py-0">
            {selectedInstitutions.length > 2 ? (
              <span className="flex h-[calc(--spacing(5.5))] items-center bg-muted px-2 text-xs font-medium text-foreground">
                {selectedInstitutions.length} selecionados
              </span>
            ) : (
              selectedInstitutions.map((institution) => (
                <ComboboxChip key={institution.id}>{institution.name}</ComboboxChip>
              ))
            )}
            <ComboboxChipsInput placeholder="Todas" />
          </ComboboxChips>
          <ComboboxContent anchor={institutionsAnchor}>
            <ComboboxEmpty>Nenhuma instituição encontrada.</ComboboxEmpty>
            <ComboboxList>
              {(institution: Institution) => (
                <ComboboxItem key={institution.id} value={institution}>
                  {institution.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="flex min-w-56 flex-col gap-2">
        <Label>Tags</Label>
        <Combobox
          multiple
          items={tags}
          value={selectedTags}
          onValueChange={handleTagsChange}
          itemToStringLabel={(tag) => tag.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <ComboboxChips ref={tagsAnchor} className="h-10 min-h-10 w-full min-w-56 py-0">
            {selectedTags.length > 2 ? (
              <span className="flex h-[calc(--spacing(5.5))] items-center bg-muted px-2 text-xs font-medium text-foreground">
                {selectedTags.length} selecionados
              </span>
            ) : (
              selectedTags.map((tag) => <ComboboxChip key={tag.id}>{tag.name}</ComboboxChip>)
            )}
            <ComboboxChipsInput placeholder="Buscar tags..." />
          </ComboboxChips>
          <ComboboxContent anchor={tagsAnchor}>
            <ComboboxEmpty>Nenhuma tag encontrada.</ComboboxEmpty>
            <ComboboxList>
              {(tag: Tag) => (
                <ComboboxItem key={tag.id} value={tag}>
                  {tag.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="months">Período</Label>
        <select
          id="months"
          name="months"
          value={filters.months}
          onChange={(event) => handleMonthsChange(event.target.value)}
          className={selectClassName}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
