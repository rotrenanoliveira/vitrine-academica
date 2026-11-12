import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { InstitutionsFilters } from './_components/institutions-filters'
import { InstitutionsList } from './_components/institutions-list'
import { loadInstitutionsFilters, type SearchParams } from './search-params'

export const metadata: Metadata = {
  title: 'Instituições',
  description: 'Instituições acadêmicas',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function InstitutionsPage({ searchParams }: PageProps) {
  const filters = await loadInstitutionsFilters(searchParams)

  return (
    <div className="flex flex-1 flex-col gap-12 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <InstitutionsFilters />
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/instituicoes/novo" />}>
            Nova instituição
          </Button>
        </div>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando instituições…</p>}>
        <InstitutionsList filters={filters} />
      </Suspense>
    </div>
  )
}
