import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
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
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="flex flex-col items-start">
              <BreadcrumbPage>Pesquisas científicas - OpenAlex</BreadcrumbPage>
              <span className="text-sm text-muted-foreground capitalize leading-none">
                Busca de trabalhos científicos na OpenAlex (API pública)
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ExternalProjectsFilters />
        <Separator />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando pesquisas…</p>}>
          <ExternalProjectsList filters={filters} />
        </Suspense>
      </div>
    </div>
  )
}
