import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/server/auth/require-user'
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
  const [filters, user] = await Promise.all([loadInstitutionsFilters(searchParams), getCurrentUser()])

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Instituições</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <InstitutionsFilters />
          <div className="flex flex-wrap gap-2">
            {user && (
              <Button variant="outline" nativeButton={false} render={<Link href="/instituicoes/minhas" />}>
                Minhas instituições
              </Button>
            )}
            <Button nativeButton={false} render={<Link href="/instituicoes/novo" />}>
              Nova instituição
            </Button>
          </div>
        </div>
        <Separator />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando instituições…</p>}>
          <InstitutionsList filters={filters} />
        </Suspense>
      </div>
    </div>
  )
}
