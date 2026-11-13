import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CallsTagFilter } from '@/components/call/calls-tag-filter'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { requireUser } from '@/server/auth/require-user'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'
import { CallsList } from './_components/calls-list'
import { loadCallsFilters, type SearchParams } from './search-params'

export const metadata: Metadata = {
  title: 'Chamados',
  description: 'Chamados para buscar colaboradores',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function CallsPage({ searchParams }: PageProps) {
  await requireUser()
  const filters = await loadCallsFilters(searchParams)
  const { tags } = await getCachedTags()
  const activeTagId = filters.tag && tags.some((tag) => tag.id === filters.tag) ? filters.tag : undefined

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Chamados</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CallsTagFilter tags={tags} activeTagId={activeTagId} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href="/chamados/candidaturas" />}>
              Minhas candidaturas
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/chamados/meus" />}>
              Meus chamados
            </Button>
            <Button nativeButton={false} render={<Link href="/chamados/novo" />}>
              Novo chamado
            </Button>
          </div>
        </div>
        <Separator />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando chamados…</p>}>
          <CallsList tagId={activeTagId} tags={tags} />
        </Suspense>
      </div>
    </div>
  )
}
