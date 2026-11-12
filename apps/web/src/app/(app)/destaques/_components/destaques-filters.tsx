'use client'

import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'
import type { Institution, Tag } from '@/utils/type'

const periodOptions = [
  { value: 1, label: 'Último mês' },
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
  { value: 12, label: 'Último ano' },
]

const selectClassName = 'border-input bg-background h-10 min-w-48 border-b px-0 text-sm outline-none'

const EMPTY_TAGS: Tag[] = []
const EMPTY_INSTITUTIONS: Institution[] = []

function sameIds(left: { id: string }[], right: { id: string }[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id)
}

type DestaquesFiltersProps = {
  title?: string | undefined
  institutionId?: string | undefined
  tagIds?: string[] | undefined
  months: number
}

export function DestaquesFilters({ title: initialTitle, institutionId, tagIds, months: initialMonths }: DestaquesFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const tagsAnchor = useComboboxAnchor()

  const [title, setTitle] = useState(initialTitle ?? '')
  const [months, setMonths] = useState(initialMonths)
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
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
  const tagIdsKey = tagIds?.join(',') ?? ''

  useEffect(() => {
    setTitle(initialTitle ?? '')
    setMonths(initialMonths)
  }, [initialTitle, initialMonths])

  useEffect(() => {
    const next = institutionId
      ? (activeInstitutions.find((institution) => institution.id === institutionId) ?? null)
      : null

    setSelectedInstitution((previous) => (previous?.id === next?.id ? previous : next))
  }, [activeInstitutions, institutionId])

  useEffect(() => {
    if (!tagIdsKey) {
      setSelectedTags((previous) => (previous.length === 0 ? previous : EMPTY_TAGS))
      return
    }

    const selectedIds = new Set(tagIdsKey.split(','))
    const next = tags.filter((tag) => selectedIds.has(tag.id))

    setSelectedTags((previous) => (sameIds(previous, next) ? previous : next))
  }, [tagIdsKey, tags])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams()
    const trimmedTitle = title.trim()

    if (trimmedTitle) params.set('title', trimmedTitle)
    if (selectedInstitution) params.set('institutionId', selectedInstitution.id)
    for (const tag of selectedTags) {
      params.append('tags', tag.id)
    }
    params.set('months', String(months))

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleClear() {
    setTitle('')
    setSelectedInstitution(null)
    setSelectedTags(EMPTY_TAGS)
    setMonths(3)
    router.push(pathname)
  }

  const hasActiveFilters = Boolean(initialTitle || institutionId || (tagIds && tagIds.length > 0) || initialMonths !== 3)

  return (
    <form method="get" onSubmit={handleSubmit} className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-48 flex-1 flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Buscar por título"
        />
      </div>

      <div className="flex min-w-56 flex-col gap-2">
        <Label>Instituição</Label>
        <Combobox
          items={activeInstitutions}
          value={selectedInstitution}
          onValueChange={(value) =>
            setSelectedInstitution((previous) => (previous?.id === value?.id ? previous : value))
          }
          itemToStringLabel={(institution) => institution.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <ComboboxInput placeholder="Todas" showClear className="h-10 w-full min-w-56" />
          <ComboboxContent>
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
          onValueChange={(value) => setSelectedTags((previous) => (sameIds(previous, value) ? previous : value))}
          itemToStringLabel={(tag) => tag.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <ComboboxChips ref={tagsAnchor} className="h-10 min-h-10 w-full min-w-56 py-0">
            {selectedTags.map((tag) => (
              <ComboboxChip key={tag.id}>{tag.name}</ComboboxChip>
            ))}
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
          value={String(months)}
          onChange={(event) => setMonths(Number(event.target.value))}
          className={selectClassName}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="invisible text-xs font-semibold tracking-wide uppercase" aria-hidden>
          Ações
        </span>
        <div className="flex h-10 items-center gap-4">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Limpar
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}
