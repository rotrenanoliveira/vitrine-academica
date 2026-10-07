import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { requireUser } from '@/server/auth/require-user'
import { ProjectsFilters } from './_components/projects-filters'
import { ProjectsList } from './_components/projects-list'
import { loadProjectsFilters, type SearchParams } from './search-params'

export const metadata: Metadata = {
  title: 'Projetos',
  description: 'Meus projetos acadêmicos',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const user = await requireUser()
  const filters = await loadProjectsFilters(searchParams)

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Projetos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ProjectsFilters />
          <Button nativeButton={false} render={<Link href="/projetos/novo" />}>
            Novo projeto
          </Button>
        </div>
        <Separator />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando projetos…</p>}>
          <ProjectsList filters={filters} userId={user.id} />
        </Suspense>
      </div>
    </div>
  )
}
