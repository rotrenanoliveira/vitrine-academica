import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getCachedInstitutionBySlug } from '@/server/http/routes/institutions/get-institution'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'
import { MembershipRequestsList } from './_components/membership-requests-list'
import { loadMembershipRequestsFilters, type SearchParams } from './search-params'

export const metadata: Metadata = {
  title: 'Solicitações de membership',
  description: 'Gerencie solicitações de entrada na instituição.',
}

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}

export default async function InstitutionMembershipRequestsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const user = await requireUser()
  const [{ institution }, filters] = await Promise.all([
    getCachedInstitutionBySlug(slug),
    loadMembershipRequestsFilters(searchParams),
  ])

  const { members } = await getCachedMyInstitutionMemberships(user.id)
  const canManage = canManageInstitution(members, institution.id, user.id)

  if (!canManage) notFound()

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
              <BreadcrumbLink render={<Link href={`/instituicoes/${institution.slug}`} />}>Detalhe</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Solicitações</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 py-8">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Solicitações</h1>
          <p className="text-sm text-muted-foreground">{institution.name}</p>
        </div>

        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando solicitações…</p>}>
          <MembershipRequestsList institutionId={institution.id} institutionSlug={institution.slug} filters={filters} />
        </Suspense>
      </div>
    </div>
  )
}
