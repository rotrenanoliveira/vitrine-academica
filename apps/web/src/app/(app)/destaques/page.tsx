import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { CurationFilters } from './_components/curation-filters'
import { CurationLists } from './_components/curation-lists'

export const metadata: Metadata = {
  title: 'Destaques',
  description: 'Os melhores projetos da comunidade acadêmica, avaliados por professores e pela própria comunidade', //3 meses
}

export const dynamic = 'force-dynamic'

const allowedMonths = [1, 3, 6, 12]
const defaultMonths = 3

type PageProps = {
  searchParams: Promise<{ institutionId?: string; months?: string }>
}

export default async function CurationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const institutionId = params.institutionId || undefined
  const requestedMonths = Number(params.months)
  const months = allowedMonths.includes(requestedMonths) ? requestedMonths : defaultMonths

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Destaques</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando filtros…</p>}>
          <CurationFilters institutionId={institutionId} months={months} />
        </Suspense>

        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando destaques…</p>}>
          <CurationLists institutionId={institutionId} months={months} />
        </Suspense>
      </div>
    </div>
  )
}
