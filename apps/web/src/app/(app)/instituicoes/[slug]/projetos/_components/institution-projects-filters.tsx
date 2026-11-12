'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useEffect, useState } from 'react'
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
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'
import type { Tag } from '@/utils/type'
import { institutionProjectsSearchParams, institutionProjectsUrlKeys } from '../search-params'

const EMPTY_TAGS: Tag[] = []

function sameIds(left: { id: string }[], right: { id: string }[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id)
}

export function InstitutionProjectsFilters() {
  const tagsAnchor = useComboboxAnchor()
  const [filters, setFilters] = useQueryStates(institutionProjectsSearchParams, {
    urlKeys: institutionProjectsUrlKeys,
    shallow: true,
  })
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchTags(),
  })

  const tags = tagsData?.tags ?? EMPTY_TAGS
  const tagIdsKey = filters.tags?.join(',') ?? ''

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
    void setFilters({ title: value === '' ? null : value, page: 1 })
  }

  function handleTagsChange(value: Tag[]) {
    const next = sameIds(selectedTags, value) ? selectedTags : value
    setSelectedTags(next)
    void setFilters({ tags: next.length > 0 ? next.map((tag) => tag.id) : null, page: 1 })
  }

  function handleClear() {
    setSelectedTags(EMPTY_TAGS)
    void setFilters({ title: null, tags: null, page: 1 })
  }

  const hasActiveFilters = Boolean(filters.title || (filters.tags && filters.tags.length > 0))

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
