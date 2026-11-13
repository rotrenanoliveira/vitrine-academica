'use client'

import { useQueryStates } from 'nuqs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { externalProjectsSearchParams, externalProjectsUrlKeys } from '../search-params'

export function ExternalProjectsFilters() {
  const [filters, setFilters] = useQueryStates(externalProjectsSearchParams, {
    urlKeys: externalProjectsUrlKeys,
    shallow: false,
  })

  const query = filters.query ?? ''
  const hasQuery = query.length > 0

  return (
    <div className="mx-auto flex w-full max-w-xl items-center gap-3">
      <Input
        id="query"
        type="search"
        placeholder="Busque por título, autores ou palavras-chave"
        className="min-w-0 flex-1 [&::-webkit-search-cancel-button]:hidden"
        value={query}
        onChange={(event) => {
          const value = event.target.value
          void setFilters({
            query: value === '' ? null : value,
            page: 1,
          })
        }}
        aria-label="Buscar pesquisas científicas"
      />
      {hasQuery ? (
        <Button
          type="button"
          onClick={() => {
            void setFilters({ query: null, page: 1 })
          }}
        >
          Limpar
        </Button>
      ) : null}
    </div>
  )
}
