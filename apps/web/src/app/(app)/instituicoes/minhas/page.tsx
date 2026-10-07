import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { MyMembershipsList } from './_components/my-memberships-list'
import { loadMyMembershipsFilters, type SearchParams } from './search-params'

export const metadata: Metadata = {
  title: 'Minhas instituições',
  description: 'Instituições das quais você faz parte.',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function MyInstitutionsPage({ searchParams }: PageProps) {
  const user = await requireUser()
  const filters = await loadMyMembershipsFilters(searchParams)

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/instituicoes" />}>Instituições</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Minhas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold">Minhas instituições</h1>
            <p className="text-sm text-muted-foreground">Membresias vinculadas à sua conta.</p>
          </div>
          <Button variant="outline" nativeButton={false} render={<Link href="/instituicoes" />}>
            Explorar instituições
          </Button>
        </div>

        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando membresias…</p>}>
          <MyMembershipsList userId={user.id} filters={filters} />
        </Suspense>
      </div>
    </div>
  )
}
