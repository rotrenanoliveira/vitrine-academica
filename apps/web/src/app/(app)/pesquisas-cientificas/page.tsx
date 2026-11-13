import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ExternalProjectsFilters } from './_components/external-projects-filters'
import { ExternalProjectsList } from './_components/external-projects-list'
import { loadExternalProjectsFilters, type SearchParams } from './search-params'

export const metadata: Metadata = {
  title: 'Pesquisas científicas',
  description: 'Busca de trabalhos científicos na OpenAlex',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function ExternalProjectsPage({ searchParams }: PageProps) {
  const filters = await loadExternalProjectsFilters(searchParams)

  return (
    <div className="flex flex-1 flex-col gap-12 p-4">
      <div className="mt-12 flex justify-center">
        <Suspense fallback={null}>
          <ExternalProjectsFilters />
        </Suspense>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando pesquisas…</p>}>
        <ExternalProjectsList filters={filters} />
      </Suspense>
    </div>
  )
}
